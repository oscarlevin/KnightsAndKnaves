<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * heartslav implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.php
 *
 * This is the main file for your game logic.
 *
 * In this PHP file, you are going to defines the rules of the game.
 */

declare(strict_types=1);

namespace Bga\Games\knightsandknaves;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

class Game extends \Table {
    private $qcards;
    private $kcards;
    private $ncards;
    private static array $CARD_SUITS;
    private static array $CARD_TYPES;

    /**
     * Your global variables labels:
     *
     * Here, you can assign labels to global variables you are using for this game. You can use any number of global
     * variables with IDs between 10 and 99. If your game has options (variants), you also have to associate here a
     * label to the corresponding ID in `gameoptions.inc.php`.
     *
     * NOTE: afterward, you can get/set the global variables with `getGameStateValue`, `setGameStateInitialValue` or
     * `setGameStateValue` functions.
     */
    public function __construct() {
        parent::__construct();
        $this->initGameStateLabels(array(
            "currentHandType" => 10,
            "trickColor" => 11,
            "alreadyPlayedHearts" => 12,
        ));

        $this->qcards = $this->getNew("module.common.deck");
        $this->qcards->init("qcard");
        $this->kcards = $this->getNew("module.common.deck");
        $this->kcards->init("kcard");
        $this->ncards = $this->getNew("module.common.deck");
        $this->ncards->init("ncard");

        self::$CARD_SUITS = [
            1 => [
                'name' => clienttranslate('Spade'),
            ],
            2 => [
                'name' => clienttranslate('Heart'),
            ],
            //3 => [
            //    'name' => clienttranslate('Club'),
            //],
            //4 => [
            //    'name' => clienttranslate('Diamond'),
            //]
        ];

        self::$CARD_TYPES = [
            2 => ['name' => '2'],
            3 => ['name' => '3'],
            4 => ['name' => '4'],
            5 => ['name' => '5'],
            6 => ['name' => '6'],
            7 => ['name' => '7'],
            8 => ['name' => '8'],
            9 => ['name' => '9'],
            10 => ['name' => '10'],
            11 => ['name' => clienttranslate('J')],
            12 => ['name' => clienttranslate('Q')],
            13 => ['name' => clienttranslate('K')],
            14 => ['name' => clienttranslate('A')]
        ];
        /* example of notification decorator.
        // automatically complete notification args when needed
        $this->notify->addDecorator(function(string $message, array $args) {
            if (isset($args['player_id']) && !isset($args['player_name']) && str_contains($message, '${player_name}')) {
                $args['player_name'] = $this->getPlayerNameById($args['player_id']);
            }
        
            if (isset($args['card_id']) && !isset($args['card_name']) && str_contains($message, '${card_name}')) {
                $args['card_name'] = self::$CARD_TYPES[$args['card_id']]['card_name'];
                $args['i18n'][] = ['card_name'];
            }
            
            return $args;
        });*/
    }

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player plays a card, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     *
     * @throws BgaUserException
     */

    function actPlayCard(int $card_id) {
        $player_id = $this->getActivePlayerId();
        $this->qcards->moveCard($card_id, 'commonarea', $player_id);
        // XXX check rules here
        $currentCard = $this->qcards->getCard($card_id);
        //$currentTrickColor = $this->getGameStateValue('trickColor');
        //if ($currentTrickColor == 0)
        //    $this->setGameStateValue('trickColor', $currentCard['type']);
        // And notify
        $this->notify->all('actPlayCard', clienttranslate('${player_name} plays ${value_displayed} ${color_displayed}'), array(
            'i18n' => array('color_displayed', 'value_displayed'),
            'card_id' => $card_id,
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            'value' => $currentCard['type_arg'],
            'value_displayed' => self::$CARD_TYPES[$currentCard['type_arg']]['name'],
            'color' => $currentCard['type'],
            'color_displayed' => self::$CARD_SUITS[$currentCard['type']]['name']
        ));
        // Next player
        $this->gamestate->nextState('getResponses');
    }

    function actGiveAnswer(string $response) {
        $player_id = $this->getCurrentPlayerID();// CURRENT!!! not active
        // XXX check rules here
        // And notify
        $this->notify->all('actGiveAnswer', clienttranslate('${player_name} gives answer ${response}'), array(
            'i18n' => array('response'),
            'player_id' => $player_id,
            'player_name' => $this->getCurrentPlayerName(),
            'response' => $response
        ));
        $this->gamestate->setPlayerNonMultiactive($player_id, 'reportAnswer'); // deactivate player; if none left, transition to 'next' state
        // Next player
        //$this->gamestate->nextState('reportAnswer');
    }

    function actGuess(string $target_id, string $tribe, int $number) {
        $player_id = $this->getActivePlayerId();
        // Notify
        $this->notify->all('actGuess', clienttranslate('${player_name} guesses'), array(
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            'target_id' => $target_id,
            'tribe' => $tribe,
            'number' => $number,
            'true_number' => $this->ncards->getCardsInLocation('hand', $target_id)
        ));
        // TODO: check the guess here.

        $guessCorrect = true; // TODO: check the guess here, set to true if correct.
        if ($guessCorrect) {
            // Notify the guess was correct
            $this->notify->all('guessCorrect', clienttranslate('${player_name} guessed correctly!'), array(
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName()
            ));
            $this->gamestate->nextState('endGame');
        } else {
            // Notify the guess was incorrect
            $this->notify->all('guessIncorrect', clienttranslate('${player_name} guessed incorrectly!'), array(
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName()
            ));
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function actPass() {
        $player_id = $this->getActivePlayerId();
        // Notify
        $this->notify->all('actPass', clienttranslate('${player_name} passes'), array(
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName()
        ));
        // Next player
        $this->gamestate->nextState('nextPlayer');
    }



    /**
     * Compute and return the current game progression.
     *
     * The number returned must be an integer between 0 and 100.
     *
     * This method is called each time we are in a game state with the "updateGameProgression" property set to true.
     *
     * @return int
     * @see ./states.inc.php
     */
    public function getGameProgression() {
        // TODO: compute and return the game progression

        return 0;
    }

    /**
     * Game state action, example content.
     *
     * The action method of state `nextPlayer` is called everytime the current game state is set to `nextPlayer`.
     */
    // WE don't think the following function does anything.
    //function stNewHand() {
    //    // Take back all cards (from any location => null) to deck
    //    $this->qcards->moveAllCardsInLocation(null, "qdeck");
    //    $this->qcards->shuffle('qdeck');
    //    // Deal 13 cards to each players
    //    // Create deck, shuffle it and give 13 initial cards
    //    $players = $this->loadPlayersBasicInfos();
    //    foreach ($players as $player_id => $player) {
    //        $qcards = $this->qcards->pickCards(7, 'qdeck', $player_id);
    //        // Notify player about his cards
    //        //$this->notify->player($player_id, 'newHand', '', array('qcards' => $qcards));
    //    }
    //    $this->setGameStateValue('alreadyPlayedHearts', 0);
    //    $this->gamestate->nextState("");
    //}

    function stMultiPlayerInit()
    {
        $active_player_id = $this->getActivePlayerId();
        $this->gamestate->setAllPlayersMultiactive();
        $this->gamestate->setPlayerNonMultiactive($active_player_id, 'reportAnswer');
    }


    function stResolveGuess()
    {
        // Stuff
            $this->gamestate->nextState( "nextPlayer" );
    }

    function stNextPlayer()
    {
        // Stuff

        // Set active player to the next player.
        $this->activeNextPlayer();

        // $this->gamestate->nextState( "playerTurnAsk" );
        $this->gamestate->nextState( "continueGame" );
    }
    //function stNewTrick() {
    //    // New trick: active the player who wins the last trick, or the player who own the club-2 card
    //    // Reset trick color to 0 (= no color)
    //    $this->setGameStateInitialValue('trickColor', 0);
    //    $this->gamestate->nextState();
    //}

    //function stNextPlayer() {
    //    // Active next player OR end the trick and go to the next trick OR end the hand
    //    if ($this->cards->countCardInLocation('cardsontable') == 4) {
    //        // This is the end of the trick
    //        $cards_on_table = $this->cards->getCardsInLocation('cardsontable');
    //        $best_value = 0;
    //        $best_value_player_id = null;
    //        $currentTrickColor = $this->getGameStateValue('trickColor');
    //        foreach ($cards_on_table as $card) {
    //            // Note: type = card color
    //            if ($card['type'] == $currentTrickColor) {
    //                if ($best_value_player_id === null || $card['type_arg'] > $best_value) {
    //                    $best_value_player_id = $card['location_arg']; // Note: location_arg = player who played this card on table
    //                    $best_value = $card['type_arg']; // Note: type_arg = value of the card
    //                }
    //            }
    //        }

    //        // Active this player => he's the one who starts the next trick
    //        $this->gamestate->changeActivePlayer($best_value_player_id);

    //        // Move all cards to "cardswon" of the given player
    //        $this->qcards->moveAllCardsInLocation('cardsontable', 'cardswon', null, $best_value_player_id);

    //        // Notify
    //        // Note: we use 2 notifications here in order we can pause the display during the first notification
    //        //  before we move all cards to the winner (during the second)
    //        $players = $this->loadPlayersBasicInfos();
    //        $this->notify->all('trickWin', clienttranslate('${player_name} wins the trick'), array(
    //            'player_id' => $best_value_player_id,
    //            'player_name' => $players[$best_value_player_id]['player_name']
    //        ));
    //        $this->notify->all('giveAllCardsToPlayer', '', array(
    //            'player_id' => $best_value_player_id
    //        ));

    //        if ($this->cards->countCardInLocation('hand') == 0) {
    //            // End of the hand
    //            $this->gamestate->nextState("endHand");
    //        } else {
    //            // End of the trick
    //            $this->gamestate->nextState("nextTrick");
    //        }
    //    } else {
    //        // Standard case (not the end of the trick)
    //        // => just active the next player
    //        $player_id = $this->activeNextPlayer();
    //        $this->giveExtraTime($player_id);
    //        $this->gamestate->nextState('nextPlayer');
    //    }
    //}

    //function stEndHand() {
    //    // Count and score points, then end the game or go to the next hand.
    //    $players = $this->loadPlayersBasicInfos();
    //    // Gets all "hearts" + queen of spades

    //    $player_to_points = array();
    //    foreach ($players as $player_id => $player) {
    //        $player_to_points[$player_id] = 0;
    //    }
    //    $cards = $this->cards->getCardsInLocation("cardswon");
    //    foreach ($cards as $card) {
    //        $player_id = $card['location_arg'];
    //        // Note: 2 = heart
    //        if ($card['type'] == 2) {
    //            $player_to_points[$player_id]++;
    //        }
    //    }
    //    // Apply scores to player
    //    foreach ($player_to_points as $player_id => $points) {
    //        if ($points != 0) {
    //            $sql = "UPDATE player SET player_score=player_score-$points  WHERE player_id='$player_id'";
    //            $this->DbQuery($sql);
    //            $heart_number = $player_to_points[$player_id];
    //            $this->notify->all("points", clienttranslate('${player_name} gets ${nbr} hearts and looses ${nbr} points'), array(
    //                'player_id' => $player_id,
    //                'player_name' => $players[$player_id]['player_name'],
    //                'nbr' => $heart_number
    //            ));
    //        } else {
    //            // No point lost (just notify)
    //            $this->notify->all("points", clienttranslate('${player_name} did not get any hearts'), array(
    //                'player_id' => $player_id,
    //                'player_name' => $players[$player_id]['player_name']
    //            ));
    //        }
    //    }
    //    $newScores = $this->getCollectionFromDb("SELECT player_id, player_score FROM player", true);
    //    $this->notify->all("newScores", 'scores', array('newScores' => $newScores));

    //    ///// Test if this is the end of the game
    //    foreach ($newScores as $player_id => $score) {
    //        if ($score <= -100) {
    //            // Trigger the end of the game !
    //            $this->gamestate->nextState("endGame");
    //            return;
    //        }
    //    }


    //    $this->gamestate->nextState("nextHand");
    //}
    /**
     * Migrate database.
     *
     * You don't have to care about this until your game has been published on BGA. Once your game is on BGA, this
     * method is called everytime the system detects a game running with your old database scheme. In this case, if you
     * change your database scheme, you just have to apply the needed changes in order to update the game database and
     * allow the game to continue to run with your new version.
     *
     * @param int $from_version
     * @return void
     */
    public function upgradeTableDb($from_version) {
        //       if ($from_version <= 1404301345)
        //       {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
        //            $this->applyDbUpgradeToAllDB( $sql );
        //       }
        //
        //       if ($from_version <= 1405061421)
        //       {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
        //            $this->applyDbUpgradeToAllDB( $sql );
        //       }
    }

    /*
     * Gather all information about current game situation (visible by the current player).
     *
     * The method is called each time the game interface is displayed to a player, i.e.:
     *
     * - when the game starts
     * - when a player refreshes the game page (F5)
     */
    protected function getAllDatas(): array {
        $result = [];

        // WARNING: We must only return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        // Get information about players.
        // NOTE: you can retrieve some extra field you added for "player" table in `dbmodel.sql` if you need it.
        $result["players"] = $this->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score` FROM `player`"
        );

        // TODO: Gather all information about current game situation (visible by player $current_player_id).
        // Cards in player hand
        $result['hand'] = $this->qcards->getCardsInLocation('hand', $current_player_id);

        // Cards played on the table
        $result['commonarea'] = $this->qcards->getCardsInLocation('commonarea');

        $result['idtribe'] = $this->kcards->getCardsInLocation('hand', $current_player_id);
        $result['idnumber'] = $this->ncards->getCardsInLocation('hand', $current_player_id);

        return $result;
    }

    /**
     * Returns the game name.
     *
     * IMPORTANT: Please do not modify. (but I did to match knightsandknaves)
     */
    protected function getGameName() {
        return "knightsandknaves";
    }

    /**
     * This method is called only once, when a new game is launched. In this method, you must setup the game
     *  according to the game rules, so that the game is ready to be played.
     */
    protected function setupNewGame($players, $options = []) {
        // Set the colors of the players with HTML color code. The default below is red/green/blue/orange/brown. The
        // number of colors defined here must correspond to the maximum number of players allowed for the gams.
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            // Now you can access both $player_id and $player array
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        // Create players based on generic information.
        //
        // NOTE: You can add extra field on player table in the database (see dbmodel.sql) and initialize
        // additional fields directly here.
        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        // Init global values with their initial values.


        // Note: hand types: 0 = give 3 cards to player on the left
        //                   1 = give 3 cards to player on the right
        //                   2 = give 3 cards to player opposite
        //                   3 = keep cards
        $this->setGameStateInitialValue('currentHandType', 0);

        // Set current trick color to zero (= no trick color)
        $this->setGameStateInitialValue('trickColor', 0);

        // Mark if we already played hearts during this hand
        $this->setGameStateInitialValue('alreadyPlayedHearts', 0);

        // Init game statistics.
        //
        // NOTE: statistics used in this file must be defined in your `stats.inc.php` file.

        // Dummy content.
        // $this->initStat("table", "table_teststat1", 0);
        // $this->initStat("player", "player_teststat1", 0);

        // TODO: Setup the initial game situation here.

        // Create cards
        $qcards = [];
        foreach (self::$CARD_SUITS as $suit => $suit_info) {
            // spade, heart, diamond, club
            foreach (self::$CARD_TYPES as $value => $info_value) {
                //  2, 3, 4, ... K, A
                $qcards[] = ['type' => $suit, 'type_arg' => $value, 'nbr' => 1];
            }
        }
        $this->qcards->createCards($qcards, 'qdeck');

        $ncards = [];
        for ($i = 1; $i <= 10; $i++) {
           // Create 10 number cards
           $ncards[] = ['type' => "idnumber", 'type_arg' => $i, 'nbr' => 1];
        }
        // foreach (self::$CARD_SUITS as $suit => $suit_info) {
        //     // spade, heart, diamond, club
        //     foreach (self::$CARD_TYPES as $value => $info_value) {
        //         //  2, 3, 4, ... K, A
        //         $ncards[] = ['type' => $suit, 'type_arg' => $value, 'nbr' => 1];
        //     }
        // }
        $this->ncards->createCards($ncards, 'ndeck');

        $kcards = [];
        $kcards[] = ['type' => "knight", 'type_arg' => 1, 'nbr' => 5];
        $kcards[] = ['type' => "knave", 'type_arg' => 2, 'nbr' => 5];
        ////for ($i = 1; $i <= 10; $i++) {
        ////    // Create 10 number cards
        ////    $ncards[] = ['type' => 'number', 'type_arg' => $i, 'nbr' => 1];
        ////}
        // foreach (self::$CARD_SUITS as $suit => $suit_info) {
        //     // spade, heart, diamond, club
        //     foreach (self::$CARD_TYPES as $value => $info_value) {
        //         //  2, 3, 4, ... K, A
        //         $kcards[] = ['type' => $suit, 'type_arg' => $value, 'nbr' => 1];
        //     }
        // }
        $this->kcards->createCards($kcards, 'kdeck');
        // Note: previous *.game.php file also had a "idcards" setup, which we haven't implemented here yet. (2025-04-03)



        // Shuffle deck
        // NOTE: tmp remove deck shuffle
        //$this->qcards->shuffle('qdeck');

        // Deal 5 cards to each players
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $player_id => $player) {
            $qcards = $this->qcards->pickCards(5, 'qdeck', $player_id);
            $kcards = $this->kcards->pickCards(1, 'kdeck', $player_id);
            $ncards = $this->ncards->pickCards(1, 'ndeck', $player_id);
        }
        //// Deal 1 card to each player from the number deck
        //foreach ($players as $player_id => $player) {
        //}
        // Activate first player once everything has been initialized and ready.
        $this->activeNextPlayer();
    }

    /**
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: pass).
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use `getCurrentPlayerId()` or `getCurrentPlayerName()`, otherwise it will fail with a
     * "Not logged" error message.
     *
     * @param array{ type: string, name: string } $state
     * @param int $active_player
     * @return void
     * @throws feException if the zombie mode is not supported at this game state.
     */
    protected function zombieTurn(array $state, int $active_player): void {
        $state_name = $state["name"];

        if ($state["type"] === "activeplayer") {
            switch ($state_name) {
                default: {
                        $this->gamestate->nextState("zombiePass");
                        break;
                    }
            }

            return;
        }

        // Make sure player is in a non-blocking status for role turn.
        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new \feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }
}
