/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KnightsAndKnaves implementation : © Oscar Levin oscar.levin@gmail.com, Tyler Markkanen tyler.j.markkanen@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

/// <amd-module name="bgagame/knightsandknaves"/>

import Gamegui = require('ebg/core/gamegui');
import "ebg/counter";
import "ebg/stock";
import { deckMap, imagesPerRow } from './deck_base';

const NUM_QUESTION_TYPES = 2; // ask-one, ask-all (no secret for now)
const NUM_QUESTIONS = 18;

class KnightsAndKnaves extends Gamegui
{
	cardwidth: number;
	cardheight: number;
	playerHand: any;
	commonArea: any;
	playerTribe: any;
	playerNumber: any;
	currentState: string;
	cardDataById: Record<string, { type: string; type_arg: string }>;

	constructor(){
		super();
		this.cardwidth = 72;
		this.cardheight = 96;
		this.currentState = '';
		this.cardDataById = {};
	}

	override setup(gamedatas: BGA.Gamedatas): void
	{
		console.log( "Starting game setup" );

		// Setting up player boards
		for (const player_id in gamedatas.players) {
			const player = gamedatas.players[player_id as any]!;
			const playerBoardDiv = $('player_board_' + player_id);
			if (playerBoardDiv) {
				dojo.place(
					`<div class="kk_player_info">
						<span class="kk_trophy_icon">🏆</span>
						<span id="trophy_count_${player_id}" class="kk_trophy_count">${(player as any).trophies || 0}</span>
					</div>`,
					playerBoardDiv
				);
				// Dim eliminated players
				if ((player as any).eliminated == 1) {
					dojo.addClass('overall_player_board_' + player_id, 'kk_eliminated');
				}
			}
		}

		// Player hand stock
		this.playerHand = new ebg.stock();
		this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
		this.playerHand.setSelectionMode(1);
		this.playerHand.image_items_per_row = 1;

		// Common area stock
		this.commonArea = new ebg.stock();
		this.commonArea.create( this, $('commonarea'), this.cardwidth, this.cardheight );
		this.commonArea.setSelectionMode(0);
		this.commonArea.image_items_per_row = 1;

		// Player tribe card stock
		this.playerTribe = new ebg.stock();
		this.playerTribe.create( this, $('myTribe'), this.cardwidth, this.cardheight );
		this.playerTribe.setSelectionMode(0);
		this.playerTribe.image_items_per_row = 1;

		// Player number card stock
		this.playerNumber = new ebg.stock();
		this.playerNumber.create( this, $('myNumber'), this.cardwidth, this.cardheight );
		this.playerNumber.setSelectionMode(0);
		this.playerNumber.image_items_per_row = 1;

		// Use card.png as the background for all stocks
		const cardImg = g_gamethemeurl + 'img/card.png';
		this.playerHand.addItemType(0, 0, cardImg, 0);
		this.commonArea.addItemType(0, 0, cardImg, 0);
		this.playerTribe.addItemType(0, 0, cardImg, 0);
		this.playerNumber.addItemType(0, 0, cardImg, 0);

		// Inject question text overlay onto question cards
		const questions = (gamedatas as any).questions as Record<number, { description: string }>;
		const extractCardId = (divId: string) => divId.split('_item_')[1] ?? divId;

		this.playerHand.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const text = data ? (questions[parseInt(data.type_arg)]?.description ?? '') : '';
			cardDiv.insertAdjacentHTML('beforeend', `<div class="kk_card_content">${text}</div>`);
		};
		this.commonArea.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const text = data ? (questions[parseInt(data.type_arg)]?.description ?? '') : '';
			cardDiv.insertAdjacentHTML('beforeend', `<div class="kk_card_content">${text}</div>`);
		};
		this.playerTribe.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const text = data ? (data.type === 'knight' ? 'Knight' : 'Knave') : '';
			cardDiv.insertAdjacentHTML('beforeend', `<div class="kk_card_content kk_identity_content">${text}</div>`);
		};
		this.playerNumber.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const text = data ? data.type_arg : '';
			cardDiv.insertAdjacentHTML('beforeend', `<div class="kk_card_content kk_identity_content kk_number_content">${text}</div>`);
		};

		// Load cards in player's hand
		for (const i in this.gamedatas!['hand']) {
			const card = this.gamedatas!['hand'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerHand.addToStockWithId(0, card.id);
		}

		// Load cards in common area
		for (const i in this.gamedatas!['commonarea']) {
			const card = this.gamedatas!['commonarea'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.commonArea.addToStockWithId(0, card.id);
		}

		// Load player's identity cards
		for (const i in this.gamedatas!['idtribe']) {
			const card = this.gamedatas!['idtribe'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerTribe.addToStockWithId(0, card.id);
		}
		for (const i in this.gamedatas!['idnumber']) {
			const card = this.gamedatas!['idnumber'][i];
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerNumber.addToStockWithId(0, card.id);
		}

		// Restore answer chips on commonarea cards from gamedatas
		if (this.gamedatas!['answers']) {
			for (const ans of this.gamedatas!['answers'] as any[]) {
				this.displayAnswerChip(ans.card_id, ans.player_id, ans.answer);
			}
		}

		// Wire up selection handler
		dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );

		this.setupNotifications();
		console.log( "Ending game setup" );
	}

	///////////////////////////////////////////////////
	//// Game & client states
	///////////////////////////////////////////////////

	override onEnteringState(...[stateName, state]: BGA.GameStateTuple<['name', 'state']>): void
	{
		console.log( 'Entering state: ' + stateName );
		this.currentState = stateName;

		switch( stateName )
		{
		case 'playerTurnAsk':
			break;
		case 'targetResponse':
			break;
		}
	}

	override onLeavingState(stateName: BGA.ActiveGameState["name"]): void
	{
		console.log( 'Leaving state: ' + stateName );
	}

	override onUpdateActionButtons(...[stateName, args]: BGA.GameStateTuple<['name', 'args']>): void
	{
		console.log( 'onUpdateActionButtons: ' + stateName, args );

		if(!this.isCurrentPlayerActive())
			return;

		switch( stateName )
		{
			case 'playerTurnAsk':
				// Show discard option
				this.addActionButton( 'discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray' );
				break;
			case 'targetResponse':
				this.removeActionButtons();
				this.promptResponse();
				break;
			case 'playerTurnGuess':
				this.removeActionButtons();
				this.promptGuessOrPass();
				break;
		}
	}

	///////////////////////////////////////////////////
	//// Utility methods
	///////////////////////////////////////////////////

	changeMainBar(message: string) {
		$("generalactions")!.innerHTML = "";
		$("pagemaintitletext")!.innerHTML = message;
	}

	getCardSpritePos(cardType: number, qIndex: number): number {
		return (cardType - 1) * imagesPerRow + qIndex;
	}

	displayAnswerChip(cardId: number | string, playerId: number | string, answer: string) {
		// Find the card element in the common area
		const cardDiv = $('commonarea_item_' + cardId);
		if (!cardDiv) return;

		const playerInfo = this.gamedatas!.players[playerId as any];
		if (!playerInfo) return;

		const color = '#' + playerInfo.color;
		const symbol = answer === 'yes' ? '👍' : '👎';
		const chipClass = answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';

		dojo.place(
			`<div class="kk_answer_chip ${chipClass}" style="color: ${color}; text-shadow: 0 0 2px ${color};" title="${playerInfo.name}: ${answer}">${symbol}</div>`,
			cardDiv
		);
	}

	///////////////////////////////////////////////////
	//// Player actions
	///////////////////////////////////////////////////

	onPlayerHandSelectionChanged( evt: Event )
	{
		if (this.currentState !== 'playerTurnAsk' || !this.isCurrentPlayerActive()) {
			return;
		}

		const selection = this.playerHand.getSelectedItems();
		if (selection.length === 0) {
			// Deselected — reset buttons
			this.removeActionButtons();
			this.addActionButton( 'discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray' );
			return;
		}

		const item = selection[0];
		const cardType = parseInt(this.cardDataById[item.id]?.type ?? '1');

		this.removeActionButtons();

		if (cardType === 1) {
			// Ask one: show target player selection
			this.changeMainBar(_("Select a player to ask:"));
			for (const pid in this.gamedatas!.players) {
				if (pid == String(this.player_id)) continue;
				const p = this.gamedatas!.players[pid as any]!;
				if ((p as any).eliminated == 1) continue;
				this.addActionButton(
					`target_button_${pid}`,
					_(p.name),
					() => this.playCardWithTarget(item.id, parseInt(pid))
				);
			}
			this.addActionButton( 'cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray' );
		} else {
			// Ask all: play immediately with confirmation
			this.changeMainBar(_("Play this card to ask everyone?"));
			this.addActionButton( 'playCard_button', _('Play Card'), () => this.playCardWithTarget(item.id, 0) );
			this.addActionButton( 'cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray' );
		}
	}

	playCardWithTarget( cardId: number, targetId: number ) {
		this.bgaPerformAction( 'actPlayCard', { card_id: cardId, target_id: targetId } );
		this.playerHand.removeFromStockById(cardId);
	}

	playCardCancel( evt: Event ) {
		this.playerHand.unselectAll();
		this.removeActionButtons();
		this.addActionButton( 'discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray' );
	}

	onDiscardAndRedraw( evt: Event ) {
		this.bgaPerformAction( 'actDiscardAndRedraw', {} );
	}

	promptResponse() {
		this.addActionButton( 'yes_button', _('Yes'), 'yesResponse' );
		this.addActionButton( 'no_button', _('No'), 'noResponse' );
	}

	yesResponse( evt: Event ) {
		this.bgaPerformAction( 'actGiveAnswer', { response: 'yes' } );
	}

	noResponse( evt: Event ) {
		this.bgaPerformAction( 'actGiveAnswer', { response: 'no' } );
	}

	promptGuessOrPass() {
		this.addActionButton( 'guess_button', _('Guess'), 'playGuessTarget' );
		this.addActionButton( 'pass_button', _('Pass'), 'playerPass', undefined, false, 'gray' );
	}

	playGuessTarget( evt: Event ) {
		this.removeActionButtons();
		this.changeMainBar(_("Whose identity do you want to guess?"));
		for (const player_id in this.gamedatas!.players) {
			if (player_id == String(this.player_id)) continue;
			const playerInfo = this.gamedatas!.players[player_id as any]!;
			if ((playerInfo as any).eliminated == 1) continue;
			this.addActionButton(
				`guess_button_${player_id}`,
				_(playerInfo.name),
				() => this.playGuessTribe(playerInfo)
			);
		}
		this.addActionButton( 'cancel_guess', _('Cancel'), () => {
			this.removeActionButtons();
			this.promptGuessOrPass();
		}, undefined, false, 'gray' );
	}

	playGuessTribe( playerInfo: BGA.GamePlayer | undefined ) {
		this.removeActionButtons();
		this.changeMainBar(`Is ${playerInfo!.name} a Knight or a Knave?`);
		this.addActionButton( 'guess_button_knight', _('Knight'), () => this.playGuessNumber(playerInfo, 'knight') );
		this.addActionButton( 'guess_button_knave', _('Knave'), () => this.playGuessNumber(playerInfo, 'knave') );
		this.addActionButton( 'cancel_guess', _('Cancel'), 'playGuessTarget', undefined, false, 'gray' );
	}

	playGuessNumber( playerInfo: BGA.GamePlayer | undefined, tribe: string ) {
		this.removeActionButtons();
		this.changeMainBar(`What is ${playerInfo!.name}'s number?`);
		for (let num = 1; num <= 10; num++) {
			const numCopy = num;
			this.addActionButton( `guess_button_${num}`, _(numCopy.toString()), () => this.finalizeGuess(playerInfo, tribe, numCopy) );
		}
		this.addActionButton( 'cancel_guess', _('Cancel'), () => this.playGuessTribe(playerInfo), undefined, false, 'gray' );
	}

	finalizeGuess( playerInfo: BGA.GamePlayer | undefined, tribe: string, num: number ) {
		this.removeActionButtons();
		this.changeMainBar(`Guess: ${playerInfo!.name} is a ${tribe} with number ${num}`);
		this.addActionButton( 'confirm_button', _('Confirm Guess'), () => this.confirmGuess(playerInfo, tribe, num) );
		this.addActionButton( 'cancel_button', _('Cancel'), 'playGuessTarget', undefined, false, 'gray' );
	}

	confirmGuess( playerInfo: BGA.GamePlayer | undefined, tribe: string, num: number ) {
		this.bgaPerformAction( 'actGuess', { target_id: String(playerInfo!.id), tribe: tribe, number: num } );
	}

	playerPass( evt: Event ) {
		this.bgaPerformAction( 'actPass', {} );
	}

	///////////////////////////////////////////////////
	//// Notification handlers
	///////////////////////////////////////////////////

	override setupNotifications = () =>
	{
		console.log( 'notifications subscriptions setup' );

		dojo.subscribe( 'actPlayCard', this, "ntf_actCardPlayed" );
		dojo.subscribe( 'actGiveAnswer', this, "ntf_actGiveAnswer" );
		dojo.subscribe( 'actPass', this, "ntf_actPass" );
		dojo.subscribe( 'guessCorrect', this, "ntf_guessResult" );
		dojo.subscribe( 'guessIncorrect', this, "ntf_guessResult" );
		dojo.subscribe( 'playerEliminated', this, "ntf_playerEliminated" );
		dojo.subscribe( 'newScores', this, "ntf_newScores" );
		dojo.subscribe( 'cardsDrawn', this, "ntf_cardsDrawn" );
		dojo.subscribe( 'newHand', this, "ntf_newHand" );
		dojo.subscribe( 'actDiscardAndRedraw', this, "ntf_discardAndRedraw" );
	}

	ntf_actCardPlayed( notif: any )
	{
		console.log( 'ntf_actCardPlayed', notif );
		this.cardDataById[notif.args.card_id] = { type: notif.args.card_type, type_arg: notif.args.card_type_arg };
		this.commonArea.addToStockWithId(0, notif.args.card_id);
		// Remove from hand if it was ours
		this.playerHand.removeFromStockById(notif.args.card_id);
	}

	ntf_actGiveAnswer( notif: any )
	{
		console.log( 'ntf_actGiveAnswer', notif );
		this.displayAnswerChip(notif.args.card_id, notif.args.player_id, notif.args.response);
	}

	ntf_actPass( notif: any )
	{
		console.log( 'ntf_actPass', notif );
	}

	ntf_guessResult( notif: any )
	{
		console.log( 'ntf_guessResult', notif );
	}

	override ntf_playerEliminated( notif: any )
	{
		console.log( 'ntf_playerEliminated', notif );
		const eliminatedId = notif.args.who_quits;
		dojo.addClass('overall_player_board_' + eliminatedId, 'kk_eliminated');
		// Update local game data
		if (this.gamedatas!.players[eliminatedId]) {
			(this.gamedatas!.players[eliminatedId] as any).eliminated = 1;
		}
	}

	ntf_newScores( notif: any )
	{
		console.log( 'ntf_newScores', notif );
		for (const pid in notif.args.newScores) {
			(this.scoreCtrl as any)[pid]?.toValue(notif.args.newScores[pid]);
		}
	}

	ntf_cardsDrawn( notif: any )
	{
		console.log( 'ntf_cardsDrawn', notif );
		for (const card of notif.args.cards) {
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerHand.addToStockWithId(0, card.id);
		}
	}

	ntf_newHand( notif: any )
	{
		console.log( 'ntf_newHand', notif );
		// Replace entire hand (after discard & redraw)
		this.playerHand.removeAll();
		for (const card of notif.args.cards) {
			this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
			this.playerHand.addToStockWithId(0, card.id);
		}
	}

	ntf_discardAndRedraw( notif: any )
	{
		console.log( 'ntf_discardAndRedraw', notif );
		// If this is our discard, the newHand notification handles the hand update
	}
}

window.bgagame = { knightsandknaves: KnightsAndKnaves };
