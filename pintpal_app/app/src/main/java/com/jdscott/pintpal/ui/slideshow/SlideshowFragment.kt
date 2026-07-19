/**
 * SlideshowFragment.kt
 *
 * Purpose: Scoreboard tab (renamed from Slideshow) — game boards + Best Pints so far.
 */
package com.jdscott.pintpal.ui.slideshow

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import androidx.fragment.app.Fragment
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.pour_game.ui.PourScoreboardActivity
import com.jdscott.pintpal.features.ratings.ui.BestPintsActivity
import com.jdscott.pintpal.features.serving_game.ui.ServingRushActivity

class SlideshowFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View = inflater.inflate(R.layout.fragment_slideshow, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        view.findViewById<Button>(R.id.scoreboard_tab_pour).setOnClickListener {
            startActivity(Intent(requireContext(), PourScoreboardActivity::class.java))
        }
        view.findViewById<Button>(R.id.scoreboard_tab_serving).setOnClickListener {
            startActivity(Intent(requireContext(), ServingRushActivity::class.java))
        }
        view.findViewById<Button>(R.id.scoreboard_tab_best_pints).setOnClickListener {
            startActivity(Intent(requireContext(), BestPintsActivity::class.java))
        }
    }
}
