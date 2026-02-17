"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("bgagame/knightsandknaves", ["require", "exports", "ebg/core/gamegui", "ebg/counter", "ebg/stock", "ebg/expandablesection"], function (require, exports, Gamegui) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KnightsAndKnaves = (function (_super) {
        __extends(KnightsAndKnaves, _super);
        function KnightsAndKnaves() {
            var _this = _super.call(this) || this;
            _this.setupNotifications = function () {
                console.log('notifications subscriptions setup');
                dojo.subscribe('cardPlayed_0', _this, "ntf_cardPlayed");
                dojo.subscribe('cardPlayed_1', _this, "ntf_cardPlayed");
                dojo.subscribe('actPlayCard', _this, "ntf_actCardPlayed");
                dojo.subscribe('actGiveAnswer', _this, "ntf_actGiveAnswer");
                dojo.subscribe('actPass', _this, "ntf_actPass");
                dojo.subscribe('actGuess', _this, "ntf_actGuess");
            };
            console.log('knightsandknaves constructor');
            _this.cardwidth = 72;
            _this.cardheight = 96;
            _this.currentState = '';
            return _this;
        }
        KnightsAndKnaves.prototype.setup = function (gamedatas) {
            console.log("Starting game setup");
            var player_id;
            for (player_id in gamedatas.players) {
                var player = gamedatas.players[player_id];
            }
            this.playerHand = new ebg.stock();
            this.playerHand.create(this, $('myhand'), this.cardwidth, this.cardheight);
            this.playerHand.setSelectionMode(1);
            console.log('playerHand', this.playerHand);
            this.playerHand.image_items_per_row = 13;
            this.commonArea = new ebg.stock();
            this.commonArea.create(this, $('commonarea'), this.cardwidth, this.cardheight);
            this.commonArea.setSelectionMode(0);
            console.log('commonArea', this.commonArea);
            this.commonArea.image_items_per_row = 13;
            this.playerTribe = new ebg.stock();
            console.log('creating playerTribe');
            this.playerTribe.create(this, $('myTribe'), this.cardwidth, this.cardheight);
            this.playerTribe.setSelectionMode(0);
            console.log('playerTribe', this.playerTribe);
            this.playerTribe.image_items_per_row = 13;
            this.playerNumber = new ebg.stock();
            this.playerNumber.create(this, $('myNumber'), this.cardwidth, this.cardheight);
            this.playerNumber.setSelectionMode(0);
            console.log('playerNumber', this.playerNumber);
            this.playerNumber.image_items_per_row = 13;
            dojo.connect(this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged');
            dojo.connect(this.commonArea, 'onChangeSelection', this, 'onPlayerHandSelectionChanged');
            for (var color = 1; color <= 4; color++) {
                for (var value = 2; value <= 14; value++) {
                    var card_type = this.getCardPositionNumber(color, value);
                    this.playerHand.addItemType(card_type, card_type, g_gamethemeurl + 'img/cards.jpg', this.getCardPositionNumber(color, value));
                    this.commonArea.addItemType(card_type, card_type, g_gamethemeurl + 'img/cards.jpg', this.getCardPositionNumber(color, value));
                    this.playerTribe.addItemType(card_type, card_type, g_gamethemeurl + 'img/kkcards.jpg', this.getCardPositionNumber(color, value));
                    console.log('addItemType', card_type);
                    this.playerNumber.addItemType(card_type, card_type, g_gamethemeurl + 'img/cardsbk.jpg', this.getCardPositionNumber(color, value));
                    console.log('addItemType', card_type);
                }
            }
            for (var i in this.gamedatas['hand']) {
                var card = this.gamedatas['hand'][i];
                var color = card.type;
                var value = card.type_arg;
                this.playerHand.addToStockWithId(this.getCardPositionNumber(color, 3), card.id);
                console.log("setting up cards in hand", this.player_id, color, value, card.id);
            }
            for (var i in this.gamedatas["commonarea"]) {
                var card = this.gamedatas["commonarea"][i];
                var color = card.type;
                var value = card.type_arg;
                this.commonArea.addToStockWithId(this.getCardPositionNumber(color, 3), card.id);
                console.log("setting up cards in common area", card, color, value);
            }
            for (var i in this.gamedatas["idtribe"]) {
                console.log("setting up cards in player tribe", i);
                var card = this.gamedatas["idtribe"][i];
                var value = card.type_arg;
                this.playerTribe.addToStockWithId(value, card.id);
                console.log("setting up cards in player tribe", card, value);
            }
            for (var i in this.gamedatas["idnumber"]) {
                console.log("setting up cards in player number", i);
                var card = this.gamedatas["idnumber"][i];
                var value = card.type_arg;
                this.playerNumber.addToStockWithId(value, card.id);
                console.log("setting up cards in player number", card, value);
            }
            console.log("gamedatas:", this.gamedatas);
            console.log("Player number cards:", this.playerNumber.getAllItems());
            this.setupNotifications();
            console.log("Ending game setup");
        };
        KnightsAndKnaves.prototype.onEnteringState = function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var stateName = _a[0], state = _a[1];
            console.log('Entering state: ' + stateName);
            this.currentState = stateName;
            switch (stateName) {
                case 'playerTurnAsk':
                    break;
                case 'targetResponse':
                    break;
            }
        };
        KnightsAndKnaves.prototype.onLeavingState = function (stateName) {
            console.log('Leaving state: ' + stateName);
        };
        KnightsAndKnaves.prototype.onUpdateActionButtons = function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var stateName = _a[0], args = _a[1];
            console.log('onUpdateActionButtons: ' + stateName, args);
            if (!this.isCurrentPlayerActive())
                return;
            switch (stateName) {
                case 'targetResponse':
                    this.removeActionButtons();
                    console.log('removed action buttons');
                    this.promptResponse();
                    console.log('added action buttons');
                    break;
                case 'playerTurnGuess':
                    this.removeActionButtons();
                    this.promptGuessOrPass();
                    console.log('added action buttons');
            }
        };
        KnightsAndKnaves.prototype.changeMainBar = function (message) {
            $("generalactions").innerHTML = "";
            $("pagemaintitletext").innerHTML = message;
        };
        KnightsAndKnaves.prototype.setPlayCardState = function () {
            this.addActionButton('playCard_button', _('Play selected card!'), 'playCardOnTable');
            this.addActionButton('cancel_button', _('Cancel'), 'playCardCancel');
        };
        KnightsAndKnaves.prototype.promptResponse = function () {
            this.addActionButton('yes_button', _('Yes'), 'yesResponse');
            this.addActionButton('no_button', _('No'), 'noResponse');
        };
        KnightsAndKnaves.prototype.promptGuessOrPass = function () {
            this.addActionButton('guess_button', _('Guess'), 'playGuessTarget');
            this.addActionButton('pass_button', _('Pass'), 'playerPass');
        };
        KnightsAndKnaves.prototype.setResetState = function () {
            this.removeActionButtons();
        };
        KnightsAndKnaves.prototype.getCardPositionNumber = function (color, value) {
            return (color - 1) * 13 + (value - 2);
        };
        KnightsAndKnaves.prototype.getCardUniqueType = function (color, value) {
            return 1024 * color + value;
        };
        KnightsAndKnaves.prototype.onPlayerHandSelectionChanged = function (evt) {
            if (this.currentState !== 'playerTurnAsk') {
                return;
            }
            if (!this.isCurrentPlayerActive()) {
                return;
            }
            console.log('onPlayerHandSelectionChanged', evt);
            var selection = this.playerHand.getSelectedItems();
            console.log('selection', selection);
            this.setPlayCardState();
        };
        KnightsAndKnaves.prototype.playCardOnTable = function (evt) {
            var selection = this.playerHand.getSelectedItems();
            var id = selection[0].id;
            var type = selection[0].type;
            var color = Math.floor(id / 13) + 1;
            var value = id % 13 + 2;
            var player_id = this.player_id;
            console.log("playerhand.getSelectedItems", this.playerHand.getSelectedItems());
            console.log('playCardOnTable');
            console.log("id = ".concat(id, ", type = ").concat(type, ", value = ").concat(value, " color = ").concat(color, ", and  player_id = ").concat(player_id, "."));
            this.bgaPerformAction('actPlayCard', { card_id: id });
            console.log("Sent ".concat(id, " to server"));
            this.playerHand.removeFromStockById(id);
            this.commonArea.addToStockWithId(type, id, "myhand");
            this.setResetState();
        };
        KnightsAndKnaves.prototype.playCardCancel = function (evt) {
            console.log('playCardCancel');
            this.playerHand.unselectAll();
            this.setResetState();
        };
        KnightsAndKnaves.prototype.yesResponse = function (evt) {
            console.log('yesResponse');
            console.log(evt);
            this.bgaPerformAction('actGiveAnswer', { response: 'yes' });
        };
        KnightsAndKnaves.prototype.noResponse = function (evt) {
            console.log('noResponse');
            console.log(evt);
            this.bgaPerformAction('actGiveAnswer', { response: 'no' });
        };
        KnightsAndKnaves.prototype.playGuessTarget = function (evt) {
            var _this = this;
            console.log('playGuessTarget', evt);
            this.removeActionButtons();
            this.changeMainBar("Whose identity do you want to guess?");
            var player_id;
            var _loop_1 = function () {
                if (player_id == this_1.player_id) {
                    return "continue";
                }
                var playerInfo = this_1.gamedatas.players[player_id];
                var c = playerInfo.color;
                var name_1 = playerInfo.name;
                console.log('player_id', player_id, name_1, c);
                console.log(playerInfo);
                console.log(this_1.gamedatas);
                this_1.addActionButton("guess_button_".concat(player_id), _(name_1), function () { return _this.playGuessTribe(playerInfo); });
            };
            var this_1 = this;
            for (player_id in this.gamedatas.players) {
                _loop_1();
            }
        };
        KnightsAndKnaves.prototype.playGuessTribe = function (playerInfo) {
            var _this = this;
            console.log('playGuessTribe', playerInfo.name);
            this.removeActionButtons();
            this.changeMainBar("Is ".concat(playerInfo.name, " a Knight or a Knave?"));
            this.addActionButton("guess_button_knight", _('Knight'), function () { return _this.playGuessNumber(playerInfo, 'knight'); });
            this.addActionButton("guess_button_knave", _('Knave'), function () { return _this.playGuessNumber(playerInfo, 'knave'); });
        };
        KnightsAndKnaves.prototype.playGuessNumber = function (playerInfo, tribe) {
            var _this = this;
            console.log('playGuessNumber', playerInfo.name, tribe);
            this.removeActionButtons();
            this.changeMainBar("What is the ".concat(playerInfo.name, "'s number?"));
            var _loop_2 = function () {
                var numCopy = num;
                this_2.addActionButton("guess_button_".concat(num), _(numCopy.toString()), function () { return _this.finalizeGuess(playerInfo, tribe, numCopy); });
            };
            var this_2 = this;
            for (var num = 1; num <= 10; num++) {
                _loop_2();
            }
        };
        KnightsAndKnaves.prototype.finalizeGuess = function (playerInfo, tribe, num) {
            var _this = this;
            console.log('finalizeGuess');
            console.log(playerInfo, tribe, num);
            this.removeActionButtons();
            this.changeMainBar("You are about to guess that ".concat(playerInfo.name, " is a ").concat(tribe, " with number ").concat(num, ":"));
            this.addActionButton('confirm_button', _('Confirm'), function () { return _this.confirmGuess(playerInfo, tribe, num); });
            this.addActionButton('cancel_button', _('Cancel'), 'playGuessTarget');
        };
        KnightsAndKnaves.prototype.confirmGuess = function (playerInfo, tribe, num) {
            console.log('confirmGuess');
            this.bgaPerformAction('actGuess', { target_id: String(playerInfo.id), tribe: tribe, number: num });
        };
        KnightsAndKnaves.prototype.playerPass = function (evt) {
            console.log('playerPass');
            this.bgaPerformAction('actPass', {});
        };
        KnightsAndKnaves.prototype.ntf_actCardPlayed = function (notif) {
            console.log('ntf_actCardPlayed', notif);
            this.commonArea.addToStockWithId(this.getCardPositionNumber(notif.args.color, notif.args.value), notif.args.card_id);
        };
        KnightsAndKnaves.prototype.ntf_actGiveAnswer = function (notif) {
            console.log('ntf_actGiveAnswer', notif);
        };
        KnightsAndKnaves.prototype.ntf_actPass = function (notif) {
            console.log('ntf_actPass', notif);
        };
        KnightsAndKnaves.prototype.ntf_actGuess = function (notif) {
            console.log('ntf_actGuess', notif);
        };
        KnightsAndKnaves.prototype.ntf_cardPlayed = function (notif) {
            console.log('ntf_cardPlayed', notif);
            this.commonArea.addToStockWithId(this.getCardPositionNumber(notif.args.color, notif.args.value), notif.args.card_id);
        };
        return KnightsAndKnaves;
    }(Gamegui));
    window.bgagame = { knightsandknaves: KnightsAndKnaves };
});
function toggleScratch(cell) {
    cell.classList.toggle('scratched');
}
