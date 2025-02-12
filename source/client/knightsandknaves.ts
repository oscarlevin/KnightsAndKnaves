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

/** See {@link BGA.Gamegui} for more information. */
class KnightsAndKnaves extends Gamegui
{
	cardwidth: number;
	cardheight: number;
	playerHand: any;
	commonArea: any;

	// myGlobalValue: number = 0;
	// myGlobalArray: string[] = [];

	/** See {@link BGA.Gamegui} for more information. */
	constructor(){
		super();
		console.log('knightsandknaves constructor');
		this.cardwidth = 72;
		this.cardheight = 96;
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

		dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
		dojo.connect( this.commonArea, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );

		// Create cards types:
		for (var color = 1; color <= 4; color++) {
			for (var value = 2; value <= 14; value++) {
				// Build card type id
				var card_type_id = this.getCardUniqueId(color, value);
				this.playerHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cardsbk.jpg', card_type_id);
				this.commonArea.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cardsbk.jpg', card_type_id);

				// var idcard_type_id = this.getCardUniqueId(color, value);
				// this.playerID.addItemType(idcard_type_id, idcard_type_id, g_gamethemeurl + 'img/cardsbk.jpg', idcard_type_id);
				console.log( 'addItemType', card_type_id );
			}
		}


		// FROM TUTORIAL FIX LATER
		// Cards in player's hand and common area
		for ( var i in this.gamedatas!['hand']) {
			var card = this.gamedatas!['hand'][i];
			var color:number = card.type;
			var value:number = card.type_arg;
			this.playerHand.addToStockWithId(this.getCardUniqueId(color, value), card.id);

			// this.playerID.addToStockWithId(this.getCardUniqueId(color, value), card.id);
			console.log("setting up cards in hand", this.player_id, color, value, card.id);
		}
		// Setup game notifications to handle (see "setupNotifications" method below)

		for ( var i in this.gamedatas!["commonarea"]) {
			var card = this.gamedatas!["commonarea"][i];
			var color:number = card.type;
			var value:number = card.type_arg;
			this.commonArea.addToStockWithId(this.getCardUniqueId(color, value), card.id);
			console.log("setting up cards in common area", card, color, value);
		}


		this.setupNotifications();

		console.log( "Ending game setup" );
	}

	///////////////////////////////////////////////////
	//// Game & client states
	
	/** See {@link BGA.Gamegui#onEnteringState} for more information. */
	override onEnteringState(...[stateName, state]: BGA.GameStateTuple<['name', 'state']>): void
	{
		console.log( 'Entering state: ' + stateName );
		
		// switch( stateName )
		// {
		// case 'dummmy':
		// 	// enable/disable any user interaction...
		// 	break;
		// }
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

		// switch( stateName )
		// {
		// case 'dummmy':
		// 	// Add buttons to action bar...
		// 	// this.addActionButton( 'button_id', _('Button label'), this.onButtonClicked );
		// 	break;
		// }
	}
	

	///////////////////////////////////////////////////
	//// Utility methods
	changeMainBar(message:string) {
		$("generalactions")!.innerHTML = "";
		$("pagemaintitletext")!.innerHTML = message;
	}

	setPlayCardState() {
		this.changeMainBar( "Changing bar" );
		this.addActionButton( 'playCard_button', _('Play selected card!'), 'playCardOnTable' );
		this.addActionButton( 'cancel_button', _('Cancel'), 'playCardCancel' );
		
		// this.zoneSelectable(true);
		// this.unhiglightCards();
	}

	setResetState() {
		this.removeActionButtons();
	}

	getCardUniqueId(color:number, value:number):number {
		return (color - 1) * 13 + (value - 2);
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
		if (!this.isCurrentPlayerActive()) 
			{
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
		this.ajaxcall( `/${this.game_name}/${this.game_name}/playCard.html`, {
			card_id: type,
			lock: true
		}, this, function() {} );
		console.log(`Sent ${id} to server`);
		this.playerHand.removeFromStockById(id, "commonarea");
		// this.playerHand.unselectAll();

		// debugger;

		this.commonArea.addToStockWithId(type, id, "myhand");
		this.setResetState();
	}

	playCardCancel( evt: Event )
	{
		console.log( 'playCardCancel' );
		this.playerHand.unselectAll();
		this.setResetState();
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
		
		// Builtin example...
		// dojo.subscribe( 'cardPlayed_1', this, "ntf_any" );
		// dojo.subscribe( 'actionTaken', this, "ntf_actionTaken" );
		// dojo.subscribe( 'cardPlayed_0', this, "ntf_cardPlayed" );
		// dojo.subscribe( 'cardPlayed_1', this, "ntf_cardPlayed" );

		//	With CommonMixin from 'cookbook/common'...
		// this.subscribeNotif( "cardPlayed_1", this.ntf_any );
		// this.subscribeNotif( "actionTaken", this.ntf_actionTaken );
		// this.subscribeNotif( "cardPlayed_0", this.ntf_cardPlayed );
		// this.subscribeNotif( "cardPlayed_1", this.ntf_cardPlayed );
	}

	/* Example:

	ntf_any( notif: BGA.Notif )
	{
		console.log( 'ntf_any', notif );
		notif.args!['arg_0'];
	}

	ntf_actionTaken( notif: BGA.Notif<'actionTaken'> ) {
		console.log( 'ntf_actionTaken', notif );
	}

	ntf_cardPlayed( notif: BGA.Notif<'cardPlayed_0' | 'cardPlayed_1'> )
	{
		console.log( 'ntf_cardPlayed', notif );
		switch( notif.type ) {
			case 'cardPlayed_0':
				notif.args.arg_0;
				break;
			case 'cardPlayed_1':
				notif.args.arg_1;
				break;
		}
	}

	*/
}


// The global 'bgagame.knightsandknaves' class is instantiated when the page is loaded and used as the Gamegui.
window.bgagame = { knightsandknaves: KnightsAndKnaves };