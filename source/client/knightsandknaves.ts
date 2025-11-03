/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KnightsAndKnaves implementation : © Oscar Levin oscar.levin@gmail.com, Tyler Markkanen tyler.j.markkanen@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

/**
 * See {@link ../../node_modules/bga-ts-template/docs/typescript/index.md} for a LOT more information on this file.
 * The file include alternative ways to structure this file, how to break it up into multiple files, and more.
 */

// Defines the name of this module. Same as putting this code into a file at path: bgagame/knightsandknaves.ts
/// <amd-module name="bgagame/knightsandknaves"/>

import Gamegui = require('ebg/core/gamegui');
import "ebg/counter";
import "ebg/stock";
import "ebg/expandablesection";

/** See {@link BGA.Gamegui} for more information. */
class KnightsAndKnaves extends Gamegui
{
	cardwidth: number;
	cardheight: number;
	playerHand: any;
	commonArea: any;
	playerTribe: any;
	playerNumber: any;
	expanded: any;
	currentState: string;

	// myGlobalValue: number = 0;
	// myGlobalArray: string[] = [];

	/** See {@link BGA.Gamegui} for more information. */
	constructor(){
		super();
		console.log('knightsandknaves constructor');
		this.cardwidth = 72;
		this.cardheight = 96;
		this.currentState = '';
	}

	/** See {@link  BGA.Gamegui#setup} for more information. */
	override setup(gamedatas: BGA.Gamedatas): void
	{
		// debugger;
		console.log( "Starting game setup" );

		// Setting up player boards
		var player_id: BGA.ID;
		for(player_id in gamedatas.players)
		{
			// NOTES: see step 6.5 of tutorial
			var player = gamedatas.players[player_id];
			// TODO: Setting up players boards if needed
		}

		// TODO: Set up your game interface here, according to "gamedatas"

		this.playerHand = new ebg.stock(); // new stock object for hand
		this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );
		// Allow only one card to be selected at a time:
		this.playerHand.setSelectionMode(1);
		console.log( 'playerHand', this.playerHand );


		this.playerHand.image_items_per_row = 13; // This refers to how many columns are in the image

		this.commonArea = new ebg.stock();
		this.commonArea.create( this, $('commonarea'), this.cardwidth, this.cardheight );
		this.commonArea.setSelectionMode(0);
		console.log( 'commonArea', this.commonArea );
		this.commonArea.image_items_per_row = 13;

		this.playerTribe = new ebg.stock();
		console.log( 'creating playerTribe' );
		this.playerTribe.create( this, $('myTribe'), this.cardwidth, this.cardheight );
		this.playerTribe.setSelectionMode(0);
		console.log( 'playerTribe', this.playerTribe );
		this.playerTribe.image_items_per_row = 13; // This refers to how many columns are in the image

		this.playerNumber = new ebg.stock();
		this.playerNumber.create( this, $('myNumber'), this.cardwidth, this.cardheight );
		this.playerNumber.setSelectionMode(0);
		console.log( 'playerNumber', this.playerNumber );
		this.playerNumber.image_items_per_row = 13; // This refers to how many columns are in the image

		// this.expanded = new ebg.expandablesection();
		// this.expanded.create(this, "center_display");
		// this.expanded.expand();   // show
		// this.expanded.collapse(); // hide
		// this.expanded.toggle();   // switch show/hide

		// Not sure exactly what this does
		dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
		dojo.connect( this.commonArea, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
		//dojo.connect( this.playerNumber, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );

		// Create Question card types:
		for (var color = 1; color <= 4; color++) {
			for (var value = 2; value <= 14; value++) {
				// Build card type id
				var card_type = this.getCardPositionNumber(color, value);
				this.playerHand.addItemType(card_type, card_type, g_gamethemeurl + 'img/cards.jpg', this.getCardPositionNumber(color, value));
				this.commonArea.addItemType(card_type, card_type, g_gamethemeurl + 'img/cards.jpg', this.getCardPositionNumber(color, value));

				// var idcard_type_id = this.getCardPositionNumber(color, value);
				 this.playerTribe.addItemType(card_type, card_type, g_gamethemeurl + 'img/kkcards.jpg', this.getCardPositionNumber(color, value));
				console.log( 'addItemType', card_type );
				 this.playerNumber.addItemType(card_type, card_type, g_gamethemeurl + 'img/cardsbk.jpg', this.getCardPositionNumber(color, value));
				console.log( 'addItemType', card_type );
			}
		}

		//for (var num = 1; num <= 10; num++) {
		//	this.playerNumber.addItemType(num, num, g_gamethemeurl + 'img/kkcards.jpg', num+26);
		//}

		// Create Number card types:
		//for (var value = 1; value <= 10; value++) {
		//	// Build card type id
		//	//var card_type = this.getCardUniqueType("number", value);
		//	this.playerNumber.addItemType(value, value, g_gamethemeurl + 'img/cardsbk.jpg', value);
		//	console.log( 'addItemType', value );
		//}

		// FROM TUTORIAL FIX LATER
		// Cards in player's hand and common area
		for ( var i in this.gamedatas!['hand']) {
			var card = this.gamedatas!['hand'][i];
			var color: number = card.type;
			var value: number = card.type_arg;
			this.playerHand.addToStockWithId(this.getCardPositionNumber(color, value), card.id);

			// this.playerID.addToStockWithId(this.getCardUniqueId(color, value), card.id);
			console.log("setting up cards in hand", this.player_id, color, value, card.id);
		}
		// Setup game notifications to handle (see "setupNotifications" method below)

		for ( var i in this.gamedatas!["commonarea"]) {
			var card = this.gamedatas!["commonarea"][i];
			var color:number = card.type;
			var value:number = card.type_arg;
			this.commonArea.addToStockWithId(this.getCardPositionNumber(color, value), card.id);
			console.log("setting up cards in common area", card, color, value);
		}

		for ( var i in this.gamedatas!["idtribe"]) {
			console.log("setting up cards in player tribe", i);
			var card = this.gamedatas!["idtribe"][i];
			var value:number = card.type_arg;
			this.playerTribe.addToStockWithId(value, card.id);
			console.log("setting up cards in player tribe", card, value);
		}

		for ( var i in this.gamedatas!["idnumber"]) {
			console.log("setting up cards in player number", i);
			var card = this.gamedatas!["idnumber"][i];
			var value:number = card.type_arg;
			this.playerNumber.addToStockWithId(value, card.id);
			console.log("setting up cards in player number", card, value);
		}

		console.log("gamedatas:", this.gamedatas);
		console.log("Player number cards:", this.playerNumber.getAllItems());
		this.setupNotifications();

		console.log( "Ending game setup" );
	}

	///////////////////////////////////////////////////
	//// Game & client states

	/** See {@link BGA.Gamegui#onEnteringState} for more information. */
	override onEnteringState(...[stateName, state]: BGA.GameStateTuple<['name', 'state']>): void
	{
		console.log( 'Entering state: ' + stateName );
		this.currentState = stateName;

		switch( stateName )
		{
		case 'playerTurnAsk':
			// enable/disable any user interaction...
			break;
		case 'targetResponse':
			// enable/disable any user interaction...
			break;
		}
	}

	/** See {@link BGA.Gamegui#onLeavingState} for more information. */
	override onLeavingState(stateName: BGA.ActiveGameState["name"]): void
	{
		console.log( 'Leaving state: ' + stateName );

		// switch( stateName )
		// {
		// case 'dummmy':
		// 	// enable/disable any user interaction...
		// 	break;
		// }
	}

	/** See {@link BGA.Gamegui#onUpdateActionButtons} for more information. */
	override onUpdateActionButtons(...[stateName, args]: BGA.GameStateTuple<['name', 'args']>): void
	{
		console.log( 'onUpdateActionButtons: ' + stateName, args );

		if(!this.isCurrentPlayerActive())
			return;

		 switch( stateName )
		 {
			case 'targetResponse':
				this.removeActionButtons();
				console.log( 'removed action buttons' );
				this.promptResponse();
				console.log( 'added action buttons' );
				break;
			case 'playerTurnGuess':
				this.removeActionButtons();
				this.promptGuessOrPass();
				console.log( 'added action buttons' );
		// case 'dummmy':
		// 	// Add buttons to action bar...
		// 	// this.addActionButton( 'button_id', _('Button label'), this.onButtonClicked );
		// 	break;
		 }
	}

	///////////////////////////////////////////////////
	//// Utility methods
	changeMainBar(message:string) {
		$("generalactions")!.innerHTML = "";
		$("pagemaintitletext")!.innerHTML = message;
	}

	setPlayCardState() {
		//this.changeMainBar( "Changing bar" );
		this.addActionButton( 'playCard_button', _('Play selected card!'), 'playCardOnTable' );
		this.addActionButton( 'cancel_button', _('Cancel'), 'playCardCancel' );

		// this.zoneSelectable(true);
		// this.unhiglightCards();
	}

	promptResponse() {
		this.addActionButton( 'yes_button', _('Yes'), 'yesResponse' );
		this.addActionButton( 'no_button', _('No'), 'noResponse' );
	}

	promptGuessOrPass() {
		this.addActionButton( 'guess_button', _('Guess'), 'playGuessTarget' );
		this.addActionButton( 'pass_button', _('Pass'), 'playerPass' );
	}

	setResetState() {
		this.removeActionButtons();
	}

	getCardPositionNumber(color:number, value:number):number {
		return (color - 1) * 13 + (value - 2);
	}

	getCardUniqueType(color: number, value: number): number {
		return 1024*color + value;
	}
	///////////////////////////////////////////////////
	//// Player's action

	/*
		Here, you are defining methods to handle player's action (ex: results of mouse click on game objects).

		Most of the time, these methods:
		- check the action is possible at this game state.
		- make a call to the game server
	*/

	onPlayerHandSelectionChanged( evt: Event )
	{
		if (this.currentState !== 'playerTurnAsk'){
			return;
		}

		if (!this.isCurrentPlayerActive()){
			return;
		}

		console.log( 'onPlayerHandSelectionChanged', evt );
		let selection = this.playerHand.getSelectedItems();
		console.log( 'selection', selection );
		this.setPlayCardState();
	}

	playCardOnTable( evt: Event )
	{
		let selection = this.playerHand.getSelectedItems();
		let id = selection[0].id;
		let type = selection[0].type;
		let color = Math.floor(id / 13) + 1;
		let value = id % 13 + 2;
		//             var type = items[0].type;
        //             var color = Math.floor(type / 13) + 1;
        //             var value = type % 13 + 2;
		// let value = this.playerHand.getSelectedItems()[0].type_arg;
		// let color = this.playerHand.getSelectedItems()[0].type;
		let player_id = this.player_id;
		console.log( "playerhand.getSelectedItems", this.playerHand.getSelectedItems() );
		console.log( 'playCardOnTable' );
		console.log( `id = ${id}, type = ${type}, value = ${value} color = ${color}, and  player_id = ${player_id}.` );
		// dojo.place(this.format_block('jstpl_cardontable', {
		// 	x : this.cardwidth * (value - 2),
		// 	y : this.cardheight * (color - 1),
		// 	player_id : player_id
		// }), 'commonarea');

		//this.ajaxcall( `/${this.game_name}/${this.game_name}/playCard.html`, {
		//	card_id: id,
		//	lock: true
		//}, this, function() {} );

		// This is the new BGA wrapper for ajaxcall:
		this.bgaPerformAction( 'actPlayCard', { card_id: id } );
		console.log(`Sent ${id} to server`);
		// this.playerHand.removeFromStockById(id, "commonarea");
		this.playerHand.removeFromStockById(id);
		// this.playerHand.unselectAll();

		// debugger;
		// The following should probably go in the notification
		this.commonArea.addToStockWithId(type, id, "myhand");
		this.setResetState();
		// this.slideToObject('cardontable_' + player_id, 'commonarea').play();
	}

	
	playCardCancel( evt: Event )
	{
		console.log( 'playCardCancel' );
		this.playerHand.unselectAll();
		this.setResetState();
	}

	yesResponse( evt: Event )
	{
		console.log( 'yesResponse' );
		console.log(evt);
		this.bgaPerformAction( 'actGiveAnswer', { response: 'yes' } );
		//this.ajaxcall( `/${this.game_name}/${this.game_name}/giveAnswer.html`, {
		//	answer: 'yes',
		//	lock: true
		//}, thisfunction() {} );
	}

	noResponse( evt: Event )
	{
		console.log( 'noResponse' );
		console.log(evt);
		this.bgaPerformAction( 'actGiveAnswer', { response: 'no' } );
		//this.ajaxcall( `/${this.game_name}/${this.game_name}/giveAnswer.html`, {
		//	answer: 3,
		//	lock: true
		//}, this, function() {} );
	}

	playGuessTarget( evt: Event )
	{
		console.log('playGuessTarget', evt);
		this.removeActionButtons();
		this.changeMainBar("Whose identity do you want to guess?");
		var player_id: BGA.ID;
		for (player_id in this.gamedatas!.players) { 
			if (player_id == this.player_id) {
				continue;
			}
			const playerInfo = this.gamedatas!.players[player_id];
			const c = playerInfo!.color;
			const name = playerInfo!.name;
			console.log('player_id', player_id, name, c);
			console.log(playerInfo);
			console.log(this.gamedatas);
			this.addActionButton( `guess_button_${player_id}`, _(name), () => this.playGuessTribe(playerInfo) );
		}
		// this.addActionButton( 'guess_button', _('Guess'), 'playGuess' );
		//this.bgaPerformAction( 'actGuess', {} );
	}

	playGuessTribe( playerInfo: BGA.GamePlayer | undefined )
	{
		console.log('playGuessTribe', playerInfo!.name);
		this.removeActionButtons();
		this.changeMainBar(`Is ${playerInfo!.name} a Knight or a Knave?`);
		this.addActionButton( `guess_button_knight`, _('Knight'), () => this.playGuessNumber(playerInfo, 'knight') );
		this.addActionButton( `guess_button_knave`, _('Knave'), () => this.playGuessNumber(playerInfo, 'knave') );
		// this.addActionButton( 'guess_button', _('Guess'), 'playGuess' );
		//this.bgaPerformAction( 'actGuess', {} );
	}

	playGuessNumber( playerInfo: BGA.GamePlayer | undefined, tribe: string )
	{
		console.log('playGuessNumber', playerInfo!.name, tribe);
		this.removeActionButtons();
		this.changeMainBar(`What is the ${playerInfo!.name}'s number?`);
		for (var num = 1; num <= 10; num++) {
			const numCopy = num; // Capture the current value of num
			this.addActionButton( `guess_button_${num}`, _(numCopy.toString()), () => this.finalizeGuess(playerInfo, tribe, numCopy) );
		}
	}

	finalizeGuess( playerInfo: BGA.GamePlayer | undefined, tribe: string, num: number )
	{
		console.log('finalizeGuess');
		console.log(playerInfo, tribe, num);

		this.removeActionButtons();
		this.changeMainBar(`You are about to guess that ${playerInfo!.name} is a ${tribe} with number ${num}:`);
		// Display what the guess is and ask for confirmation
		this.addActionButton( 'confirm_button', _('Confirm'), () => this.confirmGuess(playerInfo, tribe, num) );
		this.addActionButton( 'cancel_button', _('Cancel'), 'playGuessTarget' );

	}

	confirmGuess( playerInfo: BGA.GamePlayer | undefined, tribe: string, num: number )
	{
		console.log('confirmGuess');
		// Temporarily passing, but we will need to pass the guess info and call a new function on the server
		this.bgaPerformAction( 'actGuess', { target_id: String(playerInfo!.id), tribe: tribe, number: num } );
	}

	playerPass( evt: Event )
	{
		console.log('playerPass');
		this.bgaPerformAction( 'actPass', {} );
	}

	/* Example:

	onButtonClicked( evt: Event )
	{
		console.log( 'onButtonClicked' );

		// Preventing default browser reaction
		evt.preventDefault();

		// Builtin example...
		if(this.checkAction( 'myAction' ))
		{
			this.ajaxcall(
				`/${this.game_name!}/${this.game_name!}/myAction.html`,
				{
					lock: true,
					myArgument1: arg1,
					myArgument2: arg2,
				},
				this,
				function( server_response: unknown ) {
					// Callback only on success (no error)
					// (for player actions, this is almost always empty)
				}, function(error: boolean, errorMessage?: string, errorCode?: number) {
					// What to do after the server call in anyway (success or failure)
					// (usually catch unexpected server errors)
				},
			);
		}

		// Builtin example with new BGA wrapper...
		this.bgaPerformAction( 'myAction', { myArgument1: arg1, myArgument2: arg2 } );

		//	With CommonMixin from 'cookbook/common'...
		this.ajaxAction(
			'myAction',
			{ myArgument1: arg1, myArgument2: arg2 },
			function(error: boolean, errorMessage?: string, errorCode?: number) {
				// What to do after the server call in anyway (success or failure)
				// (usually catch unexpected server errors)
			}
		);
	}

	*/


	///////////////////////////////////////////////////
	//// Reaction to cometD notifications

	/** See {@link BGA.Gamegui#setupNotifications} for more information. */
	override setupNotifications = () =>
	{
		console.log( 'notifications subscriptions setup' );

		// TODO: here, associate your game notifications with local methods
		// dojo.subscribe('cardPlayed', this, "notif_playCard");
		// Builtin example...
		// dojo.subscribe( 'cardPlayed_1', this, "ntf_any" );
		// dojo.subscribe( 'actionTaken', this, "ntf_actionTaken" );
		dojo.subscribe( 'cardPlayed_0', this, "ntf_cardPlayed" );
		dojo.subscribe( 'cardPlayed_1', this, "ntf_cardPlayed" );
		dojo.subscribe( 'actPlayCard', this, "ntf_actCardPlayed" );
		dojo.subscribe( 'actGiveAnswer', this, "ntf_actGiveAnswer" );
		dojo.subscribe( 'actPass', this, "ntf_actPass" );
		dojo.subscribe( 'actGuess', this, "ntf_actGuess" );

		//	With CommonMixin from 'cookbook/common'...
		// this.subscribeNotif( "cardPlayed_1", this.ntf_any );
		// this.subscribeNotif( "actionTaken", this.ntf_actionTaken );
		// this.subscribeNotif( "cardPlayed_0", this.ntf_cardPlayed );
		// this.subscribeNotif( "cardPlayed_1", this.ntf_cardPlayed );
	}

	// notif_playCard : function(notif) {
	// 	// Play a card on the table
	// 	console.log('notif_playCard: ', notif.args);
	// 	this.playCardOnTable(notif.args.player_id, notif.args.color, notif.args.value, notif.args.card_id);
	// },

	/* Example:

	ntf_any( notif: BGA.Notif )
	{
		console.log( 'ntf_any', notif );
		notif.args!['arg_0'];
	}

	ntf_actionTaken( notif: BGA.Notif<'actionTaken'> ) {
		console.log( 'ntf_actionTaken', notif );
	}
	*/
	ntf_actCardPlayed( notif: BGA.Notif<'actPlayCard'> )
	{
		console.log( 'ntf_actCardPlayed', notif );
		// Show the played card in the common area of all players:
		this.commonArea.addToStockWithId(this.getCardPositionNumber(notif.args.color, notif.args.value), notif.args.card_id);
	}

	ntf_actGiveAnswer( notif: BGA.Notif<'actGiveAnswer'> )
	{
		console.log( 'ntf_actGiveAnswer', notif );
	}

	ntf_actPass( notif: BGA.Notif<'actPass'> )
	{
		console.log( 'ntf_actPass', notif );
	}

	ntf_actGuess( notif: BGA.Notif<'actGuess'> )
	{
		console.log( 'ntf_actGuess', notif );
	}
	
	ntf_cardPlayed( notif: BGA.Notif<'cardPlayed_0' | 'cardPlayed_1'> )
	{
		console.log( 'ntf_cardPlayed', notif );
		// switch( notif.type ) {
		// 	case 'cardPlayed_0':
		// 		notif.args.arg_0;
		// 		break;
		// 	case 'cardPlayed_1':
		// 		notif.args.arg_1;
		// 		break;
		// }
		this.commonArea.addToStockWithId(this.getCardPositionNumber(notif.args.color, notif.args.value), notif.args.card_id);
	}
}


// The global 'bgagame.knightsandknaves' class is instantiated when the page is loaded and used as the Gamegui.
window.bgagame = { knightsandknaves: KnightsAndKnaves };
