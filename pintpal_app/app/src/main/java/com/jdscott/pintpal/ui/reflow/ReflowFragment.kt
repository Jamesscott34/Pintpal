/**
 * ReflowFragment.kt
 *
 * Purpose: Public tab (renamed from Reflow) — games, Best Pints, community hub.
 */
package com.jdscott.pintpal.ui.reflow

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import androidx.fragment.app.Fragment
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.app_shell.ui.PublicHubActivity
import com.jdscott.pintpal.features.pour_game.ui.PourGameHubActivity
import com.jdscott.pintpal.features.ratings.ui.BestPintsActivity
import com.jdscott.pintpal.features.serving_game.ui.ServingRushActivity

class ReflowFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View = inflater.inflate(R.layout.fragment_reflow, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        view.findViewById<Button>(R.id.public_tab_pour).setOnClickListener {
            startActivity(Intent(requireContext(), PourGameHubActivity::class.java))
        }
        view.findViewById<Button>(R.id.public_tab_serving).setOnClickListener {
            startActivity(Intent(requireContext(), ServingRushActivity::class.java))
        }
        view.findViewById<Button>(R.id.public_tab_best_pints).setOnClickListener {
            startActivity(Intent(requireContext(), BestPintsActivity::class.java))
        }
        view.findViewById<Button>(R.id.public_tab_hub).setOnClickListener {
            startActivity(Intent(requireContext(), PublicHubActivity::class.java))
        }
    }
}
