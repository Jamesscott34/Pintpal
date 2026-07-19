/**
 * AdminUsersRepository.kt
 *
 * Purpose: Admin-only listing of all Firestore users documents.
 * Connects to: AdminDashboardActivity. Rules allow list/read when canViewAdmin.
 * Notes: displayRole treats canViewAdmin as admin even if role field is still "user".
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
    val displayRole: String,
    val canLogin: Boolean,
    val canViewAdmin: Boolean,
    val subscriptionPaid: Boolean,
)

object AdminRoleResolver {
    fun displayRole(data: Map<String, Any?>): String {
        val raw = (data[FirebaseConstants.UserFields.ROLE] as? String)
            ?: (data["Role"] as? String)
            ?: ""
        val normalized = raw.trim().lowercase()
        val canViewAdmin =
            data[FirebaseConstants.UserFields.CAN_VIEW_ADMIN] as? Boolean == true ||
                data["CanViewAdmin"] as? Boolean == true
        if (
            canViewAdmin ||
            normalized == "admin" ||
            normalized == "super_admin" ||
            normalized == "superadmin"
        ) {
            return "admin"
        }
        return raw.trim().ifBlank { "user" }
    }

    fun canViewAdmin(data: Map<String, Any?>): Boolean {
        return data[FirebaseConstants.UserFields.CAN_VIEW_ADMIN] as? Boolean == true ||
            data["CanViewAdmin"] as? Boolean == true ||
            displayRole(data) == "admin"
    }
}

class AdminUsersRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    suspend fun listAllUsers(): Result<List<AdminUserListItem>> = runCatching {
        val snap = firestore.collection(FirebaseConstants.Collections.USERS).get().await()
        snap.documents
            .map { doc ->
                val data = doc.data.orEmpty()
                val displayRole = AdminRoleResolver.displayRole(data)
                AdminUserListItem(
                    uid = doc.id,
                    email = data[FirebaseConstants.UserFields.EMAIL] as? String ?: "",
                    name = data[FirebaseConstants.UserFields.NAME] as? String ?: "",
                    role = data[FirebaseConstants.UserFields.ROLE] as? String ?: displayRole,
                    displayRole = displayRole,
                    canLogin = data[FirebaseConstants.UserFields.CAN_LOGIN] as? Boolean ?: false,
                    canViewAdmin = AdminRoleResolver.canViewAdmin(data),
                    subscriptionPaid =
                        data[FirebaseConstants.UserFields.SUBSCRIPTION_PAID] as? Boolean ?: false,
                )
            }
            .sortedBy { it.email.ifBlank { it.name }.lowercase() }
    }
}
