/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * KnightsAndKnaves implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * knightsandknaves.js
 *
 * KnightsAndKnaves user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

 define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock" /// stock is use to have a collection of cards.
],
function (dojo, declare) {
    return declare("bgagame.knightsandknaves", ebg.core.gamegui, {
        constructor: function(){
            console.log('knightsandknaves constructor');
            this.cardwidth = 72;
            this.cardheight = 96;
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;

        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            console.log( "Starting game setup" );
            
            // Setting up player boards
            for( var player_id in gamedatas.players )
            {
                var player = gamedatas.players[player_id];
                         
                // TODO: Setting up players boards if needed
            }
            


            // TODO: Set up your game interface here, according to "gamedatas"






            
            // Player hand -- TODO: FIX THIS LATER
            this.playerHand = new ebg.stock(); // new stock object for hand
            this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight );

            // (NEW 2024-05-28) Setting up common area
            this.commonArea = new ebg.stock(); //new stock object for common area
            this.commonArea.create( this, $('commonarea'), this.cardwidth, this.cardheight );

            // this.playerID = new ebg.stock(); // new stock object for hand
            // this.playerID.create( this, $('myid'), this.cardwidth, this.cardheight );
            

            //  2024-11-20 skipped this for now.
            dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
            // dojo.connect( this.commonArea, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
            // MORE THINGS TO FIX LATER
            this.playerHand.image_items_per_row = 13; // This refers to how many columns are in the image
            this.commonArea.image_items_per_row = 13; // This refers to how many columns are in the image
            // this.playerID.image_items_per_row = 13; // This refers to how many columns are in the image


            // Create cards types:
            for (var color = 1; color <= 4; color++) {
                for (var value = 2; value <= 14; value++) {
                    // Build card type id
                    var card_type_id = this.getCardUniqueId(color, value);
                    this.playerHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cardsbk.jpg', card_type_id);
                    this.commonArea.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cardsbk.jpg', card_type_id);//?

                    // var idcard_type_id = this.getCardUniqueId(color, value);
                    // this.playerID.addItemType(idcard_type_id, idcard_type_id, g_gamethemeurl + 'img/cardsbk.jpg', idcard_type_id);
                }
            }

            // FROM TUTORIAL FIX LATER
            // Cards in player's hand and common area
            for ( var i in this.gamedatas.hand) {
                var card = this.gamedatas.hand[i];
                var color = card.type;
                var value = card.type_arg;
                this.playerHand.addToStockWithId(this.getCardUniqueId(color, value), card.id);
                // this.playerID.addToStockWithId(this.getCardUniqueId(color, value), card.id);
                console.log("setting up cards in hand", player_id, color, value, card.id);
            }
            
            // Cards played on table
            for (i in this.gamedatas.cardsontable) {
                var card = this.gamedatas.cardsontable[i];
                var color = card.type;
                var value = card.type_arg;
                var player_id = card.location_arg;
                this.commonArea.addToStockWithId(this.getCardUniqueId(color, value), card.id);
                this.playCardOnTable(player_id, color, value, card.id);
                console.log("setting up cards on table", player_id, color, value, card.id);
            }

            // dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );
            // Note, that was already above (2024-05-28)


            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );
        },
       

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );
                
                break;
           */
           
           
            case 'dummmy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */
           
           
            case 'dummmy':
                break;
            }               
        }, 

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //        
        onUpdateActionButtons: function( stateName, args )
        {
            console.log( 'onUpdateActionButtons: '+stateName );
            console.log('onUpdateActionButtons: ' + stateName + " " + this.isCurrentPlayerActive() + " args:", args);
            if (!this.isCurrentPlayerActive()) return;
                                
            switch( stateName ){
/*               
                 Example:
 
                 case 'myGameState':
                    
                    // Add 3 action buttons in the action status bar:
                    
                    this.addActionButton( 'button_1_id', _('Button 1 label'), 'onMyMethodToCall1' ); 
                    this.addActionButton( 'button_2_id', _('Button 2 label'), 'onMyMethodToCall2' ); 
                    this.addActionButton( 'button_3_id', _('Button 3 label'), 'onMyMethodToCall3' ); 
                    break;
*/
            }
            
        },        

        ///////////////////////////////////////////////////
        //// Utility methods
        changeMainBar: function(message) {
            $("generalactions").innerHTML = "";
            $("pagemaintitletext").innerHTML = message;
        },

        setPlayCardState: function() {
            this.changeMainBar( "" );
            this.addActionButton( 'playCard_button', _('Play selected card'), 'playCardOnTable' );
            this.addActionButton( 'discardCard_button', _('Discard selected card'), '' );
            this.addActionButton( 'cancel_button', _('Cancel'), '' );
            
            // this.zoneSelectable(true);
            // this.unhiglightCards();
        },


        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */

        // Get card unique identifier based on its color and value
        // FIX LATER
        getCardUniqueId : function(color, value) {
            return (color - 1) * 13 + (value - 2);
        },

        // FROM TUTORIAL FIX LATER
        playCardOnTable : function(player_id, color, value, card_id) {
            // player_id => direction
            this.addTableCard(value, color, player_id, player_id);
            console.log('playCardOnTable: ', player_id, color, value, card_id);
            
            dojo.place(this.format_block('jstpl_cardontable', {
                x : this.cardwidth * (value - 2),
                y : this.cardheight * (color - 1),
                player_id : player_id
            }), 'commonarea');
            // above, the 'commonarea' replaced 'playertablecard_'+player_id

            if (player_id != this.player_id) {
                // Some opponent played a card
                // Move card from player panel
                console.log("player_id != this.player_id", player_id, this.player_id);
                this.placeOnObject('cardontable_' + player_id, 'commonarea');
                // replaced 'overall_player_board_'+player_id with 'commonarea'
            } else {
                // You played a card. If it exists in your hand, move card from there and remove
                // corresponding item

                if ($('myhand_item_' + card_id)) {
                    this.placeOnObject('cardontable_' + player_id, 'myhand_item_' + card_id);
                    this.playerHand.removeFromStockById(card_id);
                    this.commonArea.addToStockWithId(card_id, card_id);
                }
            }
            console.log('playCardOnTable (sliding): ', player_id, color, value, card_id);
            // In any case: move it to its final destination
            // I think: this just does cool animation, nothing more.
            this.slideToObject('cardontable_' + player_id, 'commonarea').play();

            // Cards played on table
            // console.log("Game Datas", this.gamedatas);
            // for (i in this.gamedatas.cardsontable) {
            //     var card = this.gamedatas.cardsontable[i];
            //     var color = card.type;
            //     var value = card.type_arg;
            //     var player_id = card.location_arg;
            //     this.commonArea.addToStockWithId(this.getCardUniqueId(color, value), card.id);
            //     // this.playCardOnTable(player_id, color, value, card.id);
            //     console.log("setting up cards on table", player_id, color, value, card.id);
            // }
        },


        addTableCard(value, color, card_player_id, playerTableId) {
            const x = value - 2;
            const y = color - 1;
            // const card_style = this.getGameUserPreference(100);
            document.getElementById('playertablecard_' + playerTableId).insertAdjacentHTML('beforeend', `
                <div class="card cardontable" id="cardontable_${card_player_id}" style="background-position:-${x}00% -${y}00%"></div>
            `);
        },
        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */
            onPlayerHandSelectionChanged : function() {
              var items = this.playerHand.getSelectedItems();
            //   var playerHand = this.playerPile[this.player_id];
            
              if (items.length === 0) {
                    return;
              }
              
              console.log(this.checkAction('playCard'));
            //   if (this.checkAction('playCard')) {
                console.log(items.length);
                if (items.length > 0) {
                    this.SelectionType = 'hand';
                    this.setPlayCardState();
                    console.log("here");
            //     }
            //   } else {
                // playerHand.unselectAll();
              }
            //   if (items.length > 0) {
            //       var action = 'playCard_test';
            //       if (this.checkAction(action, true)) {
            //           // Can play a card
            //           var card_id = items[0].id;   
            //           console.log('onPlayerHandSelectionChanged, 247: ', card_id);                  
            //           this.ajaxcall("/" + this.game_name + "/" + this.game_name + "/" + action + ".html", {
            //               id : card_id,
            //               lock : true
            //           }, this, function(result) {
            //           }, function(is_error) {
            //           });
            //             // this.bgaPerformAction(action, {
            //             //     id : card_id,
            //             // });
            //         // 
            //           this.playerHand.unselectAll();
            //           console.log('onPlayerHandSelectionChanged near end: ', card_id);
            //       } else if (this.checkAction('giveCards')) {
            //           // Can give cards => let the player select some cards
            //       } else {
            //           this.playerHand.unselectAll();
            //       }
            //       console.log('onPlayerHandSelectionChanged, end of outer if: ', card_id);
            //     }
                // console.log('onPlayerHandSelectionChanged, after if: ', card_id);
          },        
        /* Example:
        
        onMyMethodToCall1: function( evt )
        {
            console.log( 'onMyMethodToCall1' );
            
            // Preventing default browser reaction
            dojo.stopEvent( evt );

            // Check that this action is possible (see "possibleactions" in states.inc.php)
            if( ! this.checkAction( 'myAction' ) )
            {   return; }

            this.ajaxcall( "/knightsandknaves/knightsandknaves/myAction.html", { 
                                                                    lock: true, 
                                                                    myArgument1: arg1, 
                                                                    myArgument2: arg2,
                                                                    ...
                                                                 }, 
                         this, function( result ) {
                            
                            // What to do after the server call if it succeeded
                            // (most of the time: nothing)
                            
                         }, function( is_error) {

                            // What to do after the server call in anyway (success or failure)
                            // (most of the time: nothing)

                         } );        
        },        
        
        */
    //    FROM TUTORIAL FIX LATER - We have this above too???
        // onPlayerHandSelectionChanged: function() {
        //     var items = this.playerHand.getSelectedItems();
        //     console.log("onPlayerHandSelectionChanged", items[0]);
        //     if (items.length > 0) {
        //       // console.log('onPlayerHandSelectionChanged: ', items);
        //       //   var action = 'playCard';
        //       //   if (this.checkAction(action, true)) {
        //       //       // Can play a card
        //       //       var card_id = items[0].id;                    
        //       //       this.ajaxcall("/" + this.game_name + "/" + this.game_name + "/" + action + ".html", {
        //       //           id : card_id,
        //       //           lock : true
        //       //       }, this, function(result) {
        //       //       }, function(is_error) {
        //       //       });
        //       //       console.log('onPlayerHandSelectionChanged near end: ', card_id);
        //       //       this.playerHand.unselectAll();
        //       ////////////////////////////////////
        //         if (this.checkAction('playCard', true)) {
        //             // Can play a card

        //             var card_id = items[0].id;

        //             // TRIED 2024-2-29 to copy the following line from hearts.js

        //             // this.ajaxcall( "/knightsandknaves/knightsandknaves/playCard.html", { 
        //             //   id: card_id,
        //             //   lock: true 
        //             //   }, this, function( result ) {  }, function( is_error) { } );    
                                        

        //             console.log("on playCard "+card_id);
        //             // type is (color - 1) * 13 + (value - 2)
        //             var type = items[0].type;
        //             var color = Math.floor(type / 13) + 1;
        //             var value = type % 13 + 2;
                    
        //             this.playCardOnTable(this.player_id,color,value,card_id);

        //             this.playerHand.unselectAll();
        //         } else if (this.checkAction('giveCards')) {
        //             // Can give cards => let the player select some cards
        //         } else {
        //             this.playerHand.unselectAll();
        //         }
        //     }
        // },
        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your knightsandknaves.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );
            // Copied from hearts.js
            // dojo.subscribe('newHand', this, "notif_newHand");
            dojo.subscribe('cardPlayed', this, "notif_playCard");
            // dojo.subscribe( 'trickWin', this, "notif_trickWin" );
            // this.notifqueue.setSynchronous( 'trickWin', 1000 );
            // dojo.subscribe( 'giveAllCardsToPlayer', this, "notif_giveAllCardsToPlayer" );
            // dojo.subscribe( 'newScores', this, "notif_newScores" );

            // TODO: here, associate your game notifications with local methods
            
            // Example 1: standard notification handling
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            
            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
            // 
        },  
        
        // TODO: from this point and below, you can write your game notifications handling methods
        
        /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
            
            // TODO: play the card in the user interface.
        },    
        
        */
        notif_playCard : function(notif) {
          // Play a card on the table
          console.log('notif_playCard: ', notif.args);
          this.playCardOnTable(notif.args.player_id, notif.args.color, notif.args.value, notif.args.card_id);
      },
    //   notif_trickWin : function(notif) {
    //     // We do nothing here (just wait in order players can view the 4 cards played before they're gone.
    // },

    // notif_newScores : function(notif) {
    //     console.log('notif_newScores: ', notif.args);
    //     // Update players' scores
    //     for ( var player_id in notif.args.newScores) {
    //         this.scoreCtrl[player_id].toValue(notif.args.newScores[player_id]);
    //     }
    // },          
   });             
});
