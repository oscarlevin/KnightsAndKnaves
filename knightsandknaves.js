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
define("bgagame/knightsandknaves", ["require", "exports", "ebg/core/gamegui", "ebg/counter", "ebg/stock"], function (require, exports, Gamegui) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KnightsAndKnaves = (function (_super) {
        __extends(KnightsAndKnaves, _super);
        function KnightsAndKnaves() {
            var _this = _super.call(this) || this;
            _this.setupNotifications = function () {
                console.log('notifications subscriptions setup');
            };
            console.log('knightsandknaves constructor');
            _this.cardwidth = 72;
            _this.cardheight = 96;
            return _this;
        }
        KnightsAndKnaves.prototype.setup = function (gamedatas) {
            debugger;
            console.log("Starting game setup");
            var player_id;
            for (player_id in gamedatas.players) {
                var player = gamedatas.players[player_id];
            }
            this.playerHand = new ebg.stock();
            this.playerHand.create(this, $('myhand'), this.cardwidth, this.cardheight);
            console.log('playerHand', this.playerHand);
            this.playerHand.image_items_per_row = 13;
            for (var color = 1; color <= 4; color++) {
                for (var value = 2; value <= 14; value++) {
                    var card_type_id = this.getCardUniqueId(color, value);
                    this.playerHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cardsbk.jpg', card_type_id);
                    console.log('addItemType', card_type_id);
                }
            }
            for (var i in this.gamedatas['hand']) {
                var card = this.gamedatas['hand'][i];
                var color = card.type;
                var value = card.type_arg;
                this.playerHand.addToStockWithId(this.getCardUniqueId(color, value), card.id);
                console.log("setting up cards in hand", this.player_id, color, value, card.id);
            }
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
            switch (stateName) {
                case 'dummmy':
                    break;
            }
        };
        KnightsAndKnaves.prototype.onLeavingState = function (stateName) {
            console.log('Leaving state: ' + stateName);
            switch (stateName) {
                case 'dummmy':
                    break;
            }
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
                case 'dummmy':
                    break;
            }
        };
        KnightsAndKnaves.prototype.getCardUniqueId = function (color, value) {
            return (color - 1) * 13 + (value - 2);
        };
        return KnightsAndKnaves;
    }(Gamegui));
    window.bgagame = { knightsandknaves: KnightsAndKnaves };
});
