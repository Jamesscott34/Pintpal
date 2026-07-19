/**
 * TransformFragment.kt
 *
 * Purpose: Profile tab (renamed from Transform) — account summary + Best Pints entry.
 */
package com.jdscott.pintpal.ui.transform

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.admin.ui.AdminDashboardActivity
import com.jdscott.pintpal.features.app_shell.ui.PrivateProfileActivity
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import com.jdscott.pintpal.features.ratings.ui.BestPintsActivity
import com.jdscott.pintpal.utilities.UserPermissions
import kotlinx.coroutines.launch

class TransformFragment : Fragment() {

    private val authRepository = AuthRepository()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View = inflater.inflate(R.layout.fragment_transform, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val body = view.findViewById<TextView>(R.id.profile_tab_body)
        val adminButton = view.findViewById<Button>(R.id.profile_tab_admin)

        viewLifecycleOwner.lifecycleScope.launch {
            val document = authRepository.loadCurrentUserDocument().getOrNull()
            if (document == null) {
                startActivity(Intent(requireContext(), AuthLoginActivity::class.java))
                requireActivity().finish()
                return@launch
            }
            val flags = document.toPermissionFlags()
            val paid = UserPermissions.isSubscriptionPaid(flags)
            val photoLine = if (paid) {
                getString(R.string.auth_subscription_paid)
            } else {
                getString(
                    R.string.auth_subscription_free,
                    UserPermissions.remainingPhotoUploadsToday(flags),
                )
            }
            body.text = buildString {
                appendLine(document.name)
                appendLine(document.email)
                append("Plan: ")
                appendLine(if (paid) "Paid" else "Free")
                append(photoLine)
            }
            adminButton.visibility =
                if (UserPermissions.canViewAdmin(flags)) View.VISIBLE else View.GONE
        }

        view.findViewById<Button>(R.id.profile_tab_best_pints).setOnClickListener {
            startActivity(Intent(requireContext(), BestPintsActivity::class.java))
        }
        view.findViewById<Button>(R.id.profile_tab_full_profile).setOnClickListener {
            startActivity(Intent(requireContext(), PrivateProfileActivity::class.java))
        }
        adminButton.setOnClickListener {
            startActivity(Intent(requireContext(), AdminDashboardActivity::class.java))
        }
        view.findViewById<Button>(R.id.profile_tab_sign_out).setOnClickListener {
            authRepository.signOut()
            startActivity(Intent(requireContext(), AuthLoginActivity::class.java))
            requireActivity().finish()
        }
    }
}
