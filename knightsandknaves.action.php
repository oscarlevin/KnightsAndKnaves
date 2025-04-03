<?php
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

class action_knightsandknaves extends APP_GameAction
{
	/** @var knightsandknaves $game */
	protected $game; // Enforces functions exist on Table class

	// Constructor: please do not modify
	public function __default()
	{
		if (self::isArg('notifwindow')) {
			$this->view = "common_notifwindow";
			$this->viewArgs['table'] = self::getArg("table", AT_posint, true);
		} else {
			$this->view = "knightsandknaves_knightsandknaves";
			self::trace("Complete reinitialization of board game");
		}
	}

	public function actPlayCard()
	{
		self::setAjaxMode();

		/** @var int $card_id */
		$card_id = self::getArg('card_id', AT_int, true);

		$this->game->actPlayCard( $card_id );
		self::ajaxResponse();
	}

	public function guess()
	{
		self::setAjaxMode();

		$this->game->guess(  );
		self::ajaxResponse();
	}

	public function actGiveAnswer()
	{
		self::setAjaxMode();

		/** @var string $response */
		$response = self::getArg('response', AT_alphanum, true);

		$this->game->actGiveAnswer( $response );
		self::ajaxResponse();
	}

	public function noGuess()
	{
		self::setAjaxMode();

		$this->game->noGuess(  );
		self::ajaxResponse();
	}
}