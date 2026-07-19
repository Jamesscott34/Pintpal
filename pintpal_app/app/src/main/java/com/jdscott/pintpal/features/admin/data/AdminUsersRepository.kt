/**
 * AdminUsersRepository.kt
 *
 * Purpose: Admin-only listing of all Firestore users documents.
 * Connects to: AdminDashboardActivity. Rules allow list/read when canViewAdmin.
 */
package com.jdscott.pintpal.features.admin.data

import com.google.firebase.firestore.FirebaseFirestore
import com.jdscott.pintpal.utilities.FirebaseConstants
import kotlinx.coroutines.tasks.await

data class AdminUserListItem(
    val uid: String,
    val email: String,
    val name: String,
    val role: String,
    val canLogin: Boolean,
    val canViewAdmin: Boolean,
    val subscriptionPaid: Boolean,
)

class AdminUsersRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    suspend fun listAllUsers(): Result<List<AdminUserListItem>> = runCatching {
        val snap = firestore.collection(FirebaseConstants.Collections.USERS).get().await()
        snap.documents
            .map { doc ->
                val data = doc.data.orEmpty()
                AdminUserListItem(
                    uid = doc.id,
                    email = data[FirebaseConstants.UserFields.EMAIL] as? String ?: "",
                    name = data[FirebaseConstants.UserFields.NAME] as? String ?: "",
                    role = data[FirebaseConstants.UserFields.ROLE] as? String ?: "user",
                    canLogin = data[FirebaseConstants.UserFields.CAN_LOGIN] as? Boolean ?: false,
                    canViewAdmin =
                        data[FirebaseConstants.UserFields.CAN_VIEW_ADMIN] as? Boolean ?: false,
                    subscriptionPaid =
                        data[FirebaseConstants.UserFields.SUBSCRIPTION_PAID] as? Boolean ?: false,
                )
            }
            .sortedBy { it.email.ifBlank { it.name }.lowercase() }
    }
}
