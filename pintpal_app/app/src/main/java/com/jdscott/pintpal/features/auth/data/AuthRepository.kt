/**
 * AuthRepository.kt
 *
 * Purpose: Wraps Firebase Authentication (email/password, Google) and users document sync.
 * Connects to: Firebase Auth SDK; Firestore collection "users/{uid}" where uid = Auth UID.
 * Notes: After every successful sign-in, loads users/{user.uid} and enforces canLogin.
 *        Creates the users document on first registration / first Google sign-in only.
 *        Never elevates role, canViewAdmin, or subscriptionPaid from the client.
 *        Passwords are trimmed to avoid auth/invalid-credential from accidental spaces.
 */
package com.jdscott.pintpal.features.auth.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.jdscott.pintpal.features.auth.domain.UserDocument
import com.jdscott.pintpal.utilities.FirebaseConstants
import com.jdscott.pintpal.utilities.UserPermissions
import kotlinx.coroutines.tasks.await

class LoginDeniedException(
    message: String = "This account cannot sign in (canLogin is false).",
) : Exception(message)

class AuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    val currentUser: FirebaseUser?
        get() = auth.currentUser

    suspend fun registerWithEmail(name: String, email: String, password: String): Result<UserDocument> {
        return runCatching {
            val trimmedEmail = email.trim()
            val trimmedPassword = password.trim()
            val result = auth.createUserWithEmailAndPassword(trimmedEmail, trimmedPassword).await()
            val user = result.user ?: error("Registration succeeded but no user was returned.")
            user.updateProfile(
                UserProfileChangeRequest.Builder().setDisplayName(name.trim()).build(),
            ).await()
            val document = UserDocument.forNewRegistration(
                uid = user.uid,
                email = trimmedEmail,
                name = name.trim(),
            )
            writeUserDocument(document)
            enforceCanLoginOrSignOut(document)
        }.recoverCatching { throw Exception(mapAuthFailure(it)) }
    }

    suspend fun signInWithEmail(email: String, password: String): Result<UserDocument> {
        return runCatching {
            val result = auth
                .signInWithEmailAndPassword(email.trim(), password.trim())
                .await()
            val user = result.user ?: error("Sign-in succeeded but no user was returned.")
            loadAndEnforceLogin(user)
        }.recoverCatching { throw Exception(mapAuthFailure(it)) }
    }

    suspend fun signInWithGoogleIdToken(idToken: String): Result<UserDocument> {
        return runCatching {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val result = auth.signInWithCredential(credential).await()
            val user = result.user ?: error("Google sign-in succeeded but no user was returned.")
            loadAndEnforceLogin(user)
        }.recoverCatching { throw Exception(mapAuthFailure(it)) }
    }

    suspend fun loadCurrentUserDocument(): Result<UserDocument?> {
        return runCatching {
            val user = auth.currentUser ?: return@runCatching null
            loadAndEnforceLogin(user)
        }
    }

    fun signOut() {
        auth.signOut()
    }

    private suspend fun loadAndEnforceLogin(user: FirebaseUser): UserDocument {
        val authUid = user.uid
        require(authUid.isNotBlank()) { "Authenticated user has no UID." }

        // Profile is always users/{authUid} — document ID equals Firebase Auth UID.
        val docRef = firestore.collection(FirebaseConstants.Collections.USERS).document(authUid)
        val snapshot = docRef.get().await()
        val document = if (snapshot.exists()) {
            UserDocument.fromFirestore(authUid, snapshot.data ?: emptyMap())
        } else {
            val created = UserDocument.forNewRegistration(
                uid = authUid,
                email = user.email.orEmpty(),
                name = user.displayName?.takeIf { it.isNotBlank() }
                    ?: user.email.orEmpty().substringBefore("@"),
            )
            writeUserDocument(created)
            created
        }
        check(document.uid == authUid) {
            "User profile UID does not match authenticated Auth UID."
        }
        return enforceCanLoginOrSignOut(document)
    }

    private suspend fun writeUserDocument(document: UserDocument) {
        // Path is always users/{uid} where uid is the Auth user id.
        firestore.collection(FirebaseConstants.Collections.USERS)
            .document(document.uid)
            .set(document.toFirestoreMap(), SetOptions.merge())
            .await()
    }

    private fun enforceCanLoginOrSignOut(document: UserDocument): UserDocument {
        if (!UserPermissions.canLogin(document.toPermissionFlags())) {
            signOut()
            throw LoginDeniedException()
        }
        return document
    }

    private fun mapAuthFailure(error: Throwable): String {
        if (error is LoginDeniedException) return error.message ?: "Login denied."
        val code = (error as? FirebaseAuthException)?.errorCode
            ?: error.message.orEmpty()
        return when {
            code.contains("ERROR_INVALID_CREDENTIAL", ignoreCase = true)
                || code.contains("INVALID_LOGIN_CREDENTIALS", ignoreCase = true)
                || code.contains("ERROR_WRONG_PASSWORD", ignoreCase = true)
                || code.contains("ERROR_USER_NOT_FOUND", ignoreCase = true)
                || code.contains("invalid-credential", ignoreCase = true) ->
                "Email or password is incorrect. If you registered with Google, use Google sign-in, " +
                    "or reset the password in Firebase Auth. Avoid leading/trailing spaces."
            code.contains("ERROR_INVALID_EMAIL", ignoreCase = true) ->
                "That email address looks invalid."
            code.contains("ERROR_TOO_MANY_REQUESTS", ignoreCase = true) ->
                "Too many attempts. Wait a moment and try again."
            code.contains("ERROR_EMAIL_ALREADY_IN_USE", ignoreCase = true) ->
                "An account already exists for that email. Sign in instead."
            code.contains("ERROR_WEAK_PASSWORD", ignoreCase = true) ->
                "Password must be at least 6 characters."
            else -> error.message ?: "Sign-in failed."
        }
    }
}
