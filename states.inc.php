<?php
declare(strict_types=1);
/*
 * THIS FILE HAS BEEN AUTOMATICALLY GENERATED. ANY CHANGES MADE DIRECTLY MAY BE OVERWRITTEN.
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KnightsAndKnaves implementation : © Oscar Levin oscar.levin@gmail.com, Tyler Markkanen tyler.j.markkanen@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

/**
 * TYPE CHECKING ONLY, this function is never called.
 * If there are any undefined function errors here, you MUST rename the action within the game states file, or create the function in the game class.
 * If the function does not match the parameters correctly, you are either calling an invalid function, or you have incorrectly added parameters to a state function.
 */
if (false) {
	/** @var knightsandknaves $game */
	$game->stMultiPlayerInit();
	$game->stResolveGuess();
	$game->stNextPlayer();
}

$machinestates = array(
	1 => array(
		'name' => 'gameSetup',
		'description' => '',
		'type' => 'manager',
		'action' => 'stGameSetup',
		'transitions' => array(
			'' => 2,
		),
	),
	2 => array(
		'name' => 'playerTurnAsk',
		'description' => clienttranslate('${actplayer} must play a question card or guess'),
		'descriptionmyturn' => clienttranslate('${you} must play a question card or guess'),
		'type' => 'activeplayer',
		'possibleactions' => ['actPlayCard', 'guess'],
		'transitions' => array(
			'getResponses' => 3,
			'checkGuess' => 5,
		),
	),
	3 => array(
		'name' => 'targetResponse',
		'description' => clienttranslate('Waiting for responses from other players'),
		'descriptionmyturn' => clienttranslate('${you} must respond to the question.  What is your answer?'),
		'type' => 'multipleactiveplayer',
		'possibleactions' => ['actGiveAnswer'],
		'transitions' => array(
			'reportAnswer' => 4,
		),
		'action' => 'stMultiPlayerInit',
	),
	4 => array(
		'name' => 'playerTurnGuess',
		'description' => clienttranslate('${actplayer} may guess or pass'),
		'descriptionmyturn' => clienttranslate('${you} may guess or pass'),
		'type' => 'activeplayer',
		'possibleactions' => ['actGuess', 'actPass'],
		'transitions' => array(
			'endGame' => 99,
			'nextPlayer' => 10,
		),
	),
	5 => array(
		'name' => 'gameResolveGuess',
		'description' => clienttranslate('Let us see if the guess was correct'),
		'descriptionmyturn' => clienttranslate('Let us see if the guess was correct'),
		'type' => 'game',
		'action' => 'stResolveGuess',
		'updateGameProgression' => true,
		'transitions' => array(
			'nextPlayer' => 10,
			'endGame' => 99,
		),
	),
	10 => array(
		'name' => 'gameNextPlayer',
		'description' => '',
		'type' => 'game',
		'action' => 'stNextPlayer',
		'updateGameProgression' => true,
		'transitions' => array(
			'endGAme' => 99,
			'continueGame' => 2,
		),
	),
	99 => array(
		'name' => 'gameEnd',
		'description' => clienttranslate('End of game'),
		'type' => 'manager',
		'action' => 'stGameEnd',
		'args' => 'argGameEnd',
	),
);