/**
 * AuthRepository.kt
 *
 * Purpose: Wraps Firebase Authentication (email/password, Google) and users document sync.
 * Connects to: Firebase Auth SDK; Firestore collection "users". Called by AuthViewModel.
 * Notes: After every successful sign-in, loads users/{uid} and enforces canLogin.
 *        Creates the users document on first registration / first Google sign-in only.
 *        Never elevates role or canViewAdmin from the client.
 */
package com.jdscott.pintpal.features.auth.data

import com.google.firebase.auth.FirebaseAuth
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
    message: String = "This account is not allowed to sign in (canLogin is false).",
) : Exception(message)

class AuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    val currentUser: FirebaseUser?
        get() = auth.currentUser

    suspend fun registerWithEmail(name: String, email: String, password: String): Result<UserDocument> {
        return runCatching {
            val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
            val user = result.user ?: error("Registration succeeded but no user was returned.")
            user.updateProfile(
                UserProfileChangeRequest.Builder().setDisplayName(name.trim()).build(),
            ).await()
            val document = UserDocument.forNewRegistration(
                uid = user.uid,
                email = email.trim(),
                name = name.trim(),
            )
            writeUserDocument(document)
            enforceCanLoginOrSignOut(document)
        }
    }

    suspend fun signInWithEmail(email: String, password: String): Result<UserDocument> {
        return runCatching {
            val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
            val user = result.user ?: error("Sign-in succeeded but no user was returned.")
            loadAndEnforceLogin(user)
        }
    }

    suspend fun signInWithGoogleIdToken(idToken: String): Result<UserDocument> {
        return runCatching {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val result = auth.signInWithCredential(credential).await()
            val user = result.user ?: error("Google sign-in succeeded but no user was returned.")
            loadAndEnforceLogin(user)
        }
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
        val docRef = firestore.collection(FirebaseConstants.Collections.USERS).document(user.uid)
        val snapshot = docRef.get().await()
        val document = if (snapshot.exists()) {
            UserDocument.fromFirestore(user.uid, snapshot.data ?: emptyMap())
        } else {
            val created = UserDocument.forNewRegistration(
                uid = user.uid,
                email = user.email.orEmpty(),
                name = user.displayName?.takeIf { it.isNotBlank() }
                    ?: user.email.orEmpty().substringBefore("@"),
            )
            writeUserDocument(created)
            created
        }
        return enforceCanLoginOrSignOut(document)
    }

    private suspend fun writeUserDocument(document: UserDocument) {
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
}
