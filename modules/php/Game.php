<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KnightsAndKnaves implementation : © Oscar Levin oscar.levin@gmail.com, Tyler Markkanen tyler.j.markkanen@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.php
 *
 * This is the main file for your game logic.
 */

declare(strict_types=1);

namespace Bga\Games\knightsandknaves;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

class Game extends \Table {
    private $qcards;
    private $kcards;
    private $ncards;
    private static array $QCARD_QUESTIONS;
    private static array $QCARD_TYPES;

    public function __construct() {
        parent::__construct();
        $this->initGameStateLabels(array(
            "lastPlayedCard" => 10,
            "lastPlayedTarget" => 11,
        ));

        $this->qcards = $this->getNew("module.common.deck");
        $this->qcards->init("qcard");
        $this->kcards = $this->getNew("module.common.deck");
        $this->kcards->init("kcard");
        $this->ncards = $this->getNew("module.common.deck");
        $this->ncards->init("ncard");

        // Questions indexed 0-17, matching sprite sheet column positions.
        // 'code' is a 10-char binary string: position i (0-indexed from right) represents number (i+1).
        // '1' at a position means that number is in the "yes" set for this question.
        self::$QCARD_QUESTIONS = [
            0  => ['description' => clienttranslate('Is your number less than 2?'),    'code' => '0000000001'],
            1  => ['description' => clienttranslate('Is your number less than 3?'),    'code' => '0000000011'],
            2  => ['description' => clienttranslate('Is your number less than 4?'),    'code' => '0000000111'],
            3  => ['description' => clienttranslate('Is your number less than 5?'),    'code' => '0000001111'],
            4  => ['description' => clienttranslate('Is your number less than 6?'),    'code' => '0000011111'],
            5  => ['description' => clienttranslate('Is your number less than 7?'),    'code' => '0000111111'],
            6  => ['description' => clienttranslate('Is your number less than 8?'),    'code' => '0001111111'],
            7  => ['description' => clienttranslate('Is your number less than 9?'),    'code' => '0011111111'],
            8  => ['description' => clienttranslate('Is your number less than 10?'),   'code' => '0111111111'],
            9  => ['description' => clienttranslate('Is your number greater than 1?'), 'code' => '1111111110'],
            10 => ['description' => clienttranslate('Is your number greater than 2?'), 'code' => '1111111100'],
            11 => ['description' => clienttranslate('Is your number greater than 3?'), 'code' => '1111111000'],
            12 => ['description' => clienttranslate('Is your number greater than 4?'), 'code' => '1111110000'],
            13 => ['description' => clienttranslate('Is your number greater than 5?'), 'code' => '1111100000'],
            14 => ['description' => clienttranslate('Is your number greater than 6?'), 'code' => '1111000000'],
            15 => ['description' => clienttranslate('Is your number greater than 7?'), 'code' => '1110000000'],
            16 => ['description' => clienttranslate('Is your number greater than 8?'), 'code' => '1100000000'],
            17 => ['description' => clienttranslate('Is your number greater than 9?'), 'code' => '1000000000'],
        ];

        self::$QCARD_TYPES = [
            1 => ['name' => clienttranslate('Ask one player')],
            2 => ['name' => clienttranslate('Ask all players')],
            3 => ['name' => clienttranslate('Ask in secret')],
        ];
    }

    //////////////////////////////////////////////////////////////////
    // Player Actions
    //////////////////////////////////////////////////////////////////

    function actPlayCard(int $card_id, int $target_id = 0) {
        $player_id = (int) $this->getActivePlayerId();
        $currentCard = $this->qcards->getCard($card_id);

        if ($currentCard['location'] !== 'hand' || $currentCard['location_arg'] != $player_id) {
            throw new \BgaUserException("This card is not in your hand");
        }

        $card_type = (int)$currentCard['type'];
        $card_type_arg = (int)$currentCard['type_arg'];

        // Validate target for ask-one and ask-in-secret cards
        if ($card_type == 1 || $card_type == 3) {
            if ($target_id == 0) {
                throw new \BgaUserException("You must select a target player for this card");
            }
            if ($target_id == $player_id) {
                throw new \BgaUserException("You cannot ask yourself a question");
            }
            $target_eliminated = $this->getUniqueValueFromDB("SELECT player_eliminated FROM player WHERE player_id = '$target_id'");
            if ($target_eliminated) {
                throw new \BgaUserException("That player has been eliminated");
            }
        }

        $this->qcards->moveCard($card_id, 'commonarea', $player_id);
        $this->setGameStateValue('lastPlayedCard', $card_id);
        $this->setGameStateValue('lastPlayedTarget', $target_id);
        $this->incStat(1, 'questions_asked', $player_id);

        $question_info = self::$QCARD_QUESTIONS[$card_type_arg] ?? ['description' => '???'];
        $type_info = self::$QCARD_TYPES[$card_type] ?? ['name' => '???'];

        $notif_args = [
            'i18n' => ['question_text', 'card_type_name'],
            'card_id' => $card_id,
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            'card_type' => $card_type,
            'card_type_arg' => $card_type_arg,
            'question_text' => $question_info['description'],
            'card_type_name' => $type_info['name'],
            'target_id' => $target_id,
        ];

        if ($card_type == 3) {
            $target_name = $this->getPlayerNameById($target_id);
            $notif_args['target_name'] = $target_name;
            $notif_args['is_secret'] = 1;
            $notif_args['question_text'] = ''; // don't reveal question publicly
            $notif_args['card_type_arg'] = -1; // hide question index from non-participants
            $this->notify->all('actPlayCard', clienttranslate('${player_name} asks ${target_name} a question in secret'), $notif_args);
            // Send private notification to target with actual question
            $this->notify->player((int)$target_id, 'secretQuestion', '', [
                'card_id' => $card_id,
                'card_type_arg' => $card_type_arg,
                'question_text' => $question_info['description'],
                'target_id' => $target_id,
            ]);
        } elseif ($card_type == 1 && $target_id > 0) {
            $target_name = $this->getPlayerNameById($target_id);
            $notif_args['target_name'] = $target_name;
            $this->notify->all('actPlayCard', clienttranslate('${player_name} asks ${target_name}: ${question_text}'), $notif_args);
        } else {
            $this->notify->all('actPlayCard', clienttranslate('${player_name} asks everyone: ${question_text}'), $notif_args);
        }

        $this->gamestate->nextState('getResponses');
    }

    function actGiveAnswer(string $response) {
        $player_id = (int) $this->getCurrentPlayerID(); // CURRENT, not active
        $response = strtolower($response);

        // Look up the current question card
        $last_card_id = $this->getGameStateValue('lastPlayedCard');
        $card = $this->qcards->getCard($last_card_id);
        $card_type_arg = (int)$card['type_arg'];
        $question = self::$QCARD_QUESTIONS[$card_type_arg];
        $code = $question['code'];

        // Look up responding player's identity
        $tribe_cards = $this->kcards->getCardsInLocation('hand', $player_id);
        $tribe_card = array_values($tribe_cards)[0];
        $tribe = $tribe_card['type']; // 'knight' or 'knave'

        $number_cards = $this->ncards->getCardsInLocation('hand', $player_id);
        $number_card = array_values($number_cards)[0];
        $number = (int)$number_card['type_arg']; // 1-10

        // Code string: position 0 (leftmost) = number 10, position 9 (rightmost) = number 1
        $truth = ($code[10 - $number] === '1');

        // Knights tell truth, knaves lie
        $correct_answer = ($tribe === 'knight') ? $truth : !$truth;
        $correct_response = $correct_answer ? 'yes' : 'no';

        if ($response !== $correct_response) {
            throw new \BgaUserException($this->_("That's not correct! Remember your identity and try again."));
        }

        // Record the answer in tracking table
        $this->DbQuery("INSERT INTO qcard_answer (card_id, player_id, answer) VALUES ('$last_card_id', '$player_id', '$response')");

        $player_color = $this->getUniqueValueFromDB("SELECT player_color FROM player WHERE player_id = '$player_id'");

        $this->notify->all('actGiveAnswer', clienttranslate('${player_name} answers ${response}'), [
            'i18n' => ['response'],
            'player_id' => $player_id,
            'player_name' => $this->getCurrentPlayerName(),
            'response' => $response,
            'card_id' => $last_card_id,
            'player_color' => $player_color,
        ]);

        $this->gamestate->setPlayerNonMultiactive($player_id, 'reportAnswer');
    }

    function actGuess(string $target_id, string $tribe, int $number) {
        $player_id = (int) $this->getActivePlayerId();
        $target_id = (int) $target_id;

        $target_eliminated = $this->getUniqueValueFromDB("SELECT player_eliminated FROM player WHERE player_id = $target_id");
        if ($target_eliminated) {
            throw new \BgaUserException("That player has already been eliminated");
        }

        $actual_number = (int)$this->getUniqueValueFromDB("SELECT card_type_arg FROM ncard WHERE card_location_arg = $target_id LIMIT 1");
        $actual_tribe = $this->getUniqueValueFromDB("SELECT card_type FROM kcard WHERE card_location_arg = $target_id LIMIT 1");

        if ($actual_number === 0 || $actual_tribe === null) {
            throw new \BgaUserException("Target player's identity cards not found");
        }

        $guessCorrect = ($actual_tribe === $tribe && $actual_number === $number);
        $target_name = $this->getPlayerNameById($target_id);

        if ($guessCorrect) {
            $this->eliminatePlayer($target_id);
            $this->DbQuery("UPDATE player SET player_trophies = player_trophies + 1, player_score = player_score + 1 WHERE player_id = $player_id");
            $this->qcards->moveAllCardsInLocation('hand', 'discard', $target_id);
            $this->incStat(1, 'correct_guesses', $player_id);

            $this->notify->all('guessCorrect', clienttranslate('${player_name} correctly guesses that ${target_name} is a ${tribe} with number ${number}! ${target_name} is eliminated.'), [
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'target_id' => $target_id,
                'target_name' => $target_name,
                'tribe' => $tribe,
                'number' => $number,
            ]);
        } else {
            $this->eliminatePlayer($player_id);
            $this->DbQuery("UPDATE player SET player_trophies = player_trophies + 1, player_score = player_score + 1 WHERE player_id = $target_id");
            $this->qcards->moveAllCardsInLocation('hand', 'discard', $player_id);
            $this->incStat(1, 'wrong_guesses', $player_id);

            $this->notify->all('guessIncorrect', clienttranslate('${player_name} incorrectly guesses that ${target_name} is a ${tribe} with number ${number}. ${player_name} is eliminated!'), [
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'target_id' => $target_id,
                'target_name' => $target_name,
                'tribe' => $tribe,
                'number' => $number,
            ]);
        }

        $newScores = $this->getCollectionFromDb("SELECT player_id, player_score FROM player", true);
        $this->notify->all("newScores", '', ['newScores' => $newScores]);

        // Check if game should end
        $active_count = $this->getUniqueValueFromDB("SELECT COUNT(*) FROM player WHERE player_eliminated = 0");
        if ($active_count <= 1) {
            $remaining = $this->getUniqueValueFromDB("SELECT player_id FROM player WHERE player_eliminated = 0");
            if ($remaining) {
                $this->DbQuery("UPDATE player SET player_trophies = player_trophies + 1, player_score = player_score + 1 WHERE player_id = '$remaining'");
                $newScores = $this->getCollectionFromDb("SELECT player_id, player_score FROM player", true);
                $this->notify->all("newScores", '', ['newScores' => $newScores]);
            }
            $this->gamestate->nextState('endGame');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function actPass() {
        $player_id = (int) $this->getActivePlayerId();
        $this->notify->all('actPass',clienttranslate('${player_name} passes'), [
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
        ]);
        $this->gamestate->nextState('nextPlayer');
    }

    function actDiscardAndRedraw() {
        $player_id = (int) $this->getActivePlayerId();
        $this->qcards->moveAllCardsInLocation('hand', 'discard', $player_id);
        $newCards = $this->qcards->pickCards(5, 'qdeck', $player_id);

        $this->notify->player($player_id, 'newHand', '', ['cards' => $newCards]);
        $this->notify->all('actDiscardAndRedraw', clienttranslate('${player_name} discards their hand and draws new cards'), [
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
        ]);

        $this->gamestate->nextState('nextPlayer');
    }

    //////////////////////////////////////////////////////////////////
    // Game Progression
    //////////////////////////////////////////////////////////////////

    public function getGameProgression() {
        $total = $this->getUniqueValueFromDB("SELECT COUNT(*) FROM player");
        $eliminated = $this->getUniqueValueFromDB("SELECT COUNT(*) FROM player WHERE player_eliminated = 1");
        if ($total <= 1) return 0;
        return (int)(($eliminated / ($total - 1)) * 100);
    }

    //////////////////////////////////////////////////////////////////
    // State handlers
    //////////////////////////////////////////////////////////////////

    function stMultiPlayerInit()
    {
        $active_player_id = (int) $this->getActivePlayerId();
        $last_card_id = $this->getGameStateValue('lastPlayedCard');
        $card = $this->qcards->getCard($last_card_id);
        $card_type = (int)$card['type'];

        if ($card_type == 1 || $card_type == 3) {
            // Ask one / Ask in secret: only activate the target player
            $target_id = $this->getGameStateValue('lastPlayedTarget');
            $this->gamestate->setAllPlayersMultiactive();
            $players = $this->loadPlayersBasicInfos();
            foreach ($players as $pid => $player) {
                if ($pid != $target_id) {
                    $this->gamestate->setPlayerNonMultiactive($pid, 'reportAnswer');
                }
            }
        } else {
            // Ask all: activate everyone except the asker and eliminated players
            $this->gamestate->setAllPlayersMultiactive();
            $this->gamestate->setPlayerNonMultiactive($active_player_id, 'reportAnswer');
            $eliminated = $this->getCollectionFromDb("SELECT player_id FROM player WHERE player_eliminated = 1");
            foreach ($eliminated as $pid => $row) {
                $this->gamestate->setPlayerNonMultiactive($pid, 'reportAnswer');
            }
        }
    }

    function stResolveGuess()
    {
        $this->gamestate->nextState("nextPlayer");
    }

    function stNextPlayer()
    {
        // Draw cards for the current active player to replenish to 5
        $current_player_id = (int) $this->getActivePlayerId();
        $hand_count = $this->qcards->countCardInLocation('hand', $current_player_id);
        if ($hand_count < 5) {
            $cards_to_draw = 5 - $hand_count;
            $deck_count = $this->qcards->countCardInLocation('qdeck');
            if ($deck_count > 0) {
                $draw_count = min($cards_to_draw, $deck_count);
                $newCards = $this->qcards->pickCards($draw_count, 'qdeck', $current_player_id);
                $this->notify->player($current_player_id, 'cardsDrawn', '', ['cards' => $newCards]);
            }
        }

        // Find next non-eliminated player
        $player_id = $this->activeNextPlayer();
        $max_attempts = $this->getPlayersNumber();
        $attempts = 0;
        while ($attempts < $max_attempts) {
            $eliminated = $this->getUniqueValueFromDB("SELECT player_eliminated FROM player WHERE player_id = '$player_id'");
            if (!$eliminated) {
                break;
            }
            $player_id = $this->activeNextPlayer();
            $attempts++;
        }

        // Check if game should end
        $active_count = $this->getUniqueValueFromDB("SELECT COUNT(*) FROM player WHERE player_eliminated = 0");
        if ($active_count <= 1) {
            $remaining = $this->getUniqueValueFromDB("SELECT player_id FROM player WHERE player_eliminated = 0");
            if ($remaining) {
                $this->DbQuery("UPDATE player SET player_trophies = player_trophies + 1, player_score = player_score + 1 WHERE player_id = '$remaining'");
            }
            $this->gamestate->nextState("endGame");
        } else {
            $this->giveExtraTime($player_id);
            $this->incStat(1, 'turns_number');
            $this->incStat(1, 'turns_number', $player_id);
            $this->gamestate->nextState("continueGame");
        }
    }

    //////////////////////////////////////////////////////////////////
    // DB Migration
    //////////////////////////////////////////////////////////////////

    public function upgradeTableDb($from_version) {
    }

    //////////////////////////////////////////////////////////////////
    // getAllDatas — game state visible to the current player
    //////////////////////////////////////////////////////////////////

    protected function getAllDatas(): array {
        $result = [];
        $current_player_id = (int) $this->getCurrentPlayerId();

        // Use standard player data (includes player_name, player_color, etc.) and add custom fields
        $result["players"] = $this->loadPlayersBasicInfos();
        $extra = $this->getCollectionFromDb(
            "SELECT `player_id`, `player_eliminated` `eliminated`, `player_trophies` `trophies` FROM `player`"
        );
        foreach ($result["players"] as $pid => &$player) {
            $player['eliminated'] = $extra[$pid]['eliminated'] ?? 0;
            $player['trophies']   = $extra[$pid]['trophies'] ?? 0;
        }
        unset($player);

        // Cards in player hand
        $result['hand'] = $this->qcards->getCardsInLocation('hand', $current_player_id);

        // Cards played on the table
        $result['commonarea'] = $this->qcards->getCardsInLocation('commonarea');

        // Player's identity cards (private)
        $result['idtribe'] = $this->kcards->getCardsInLocation('hand', $current_player_id);
        $result['idnumber'] = $this->ncards->getCardsInLocation('hand', $current_player_id);

        // Answer chips on all commonarea cards
        $result['answers'] = array_values($this->getObjectListFromDB(
            "SELECT card_id, player_id, answer FROM qcard_answer"
        ));

        // Question definitions for client-side display
        $result['questions'] = self::$QCARD_QUESTIONS;
        $result['cardTypes'] = self::$QCARD_TYPES;

        // Current question card state (needed when reloading mid-response)
        $result['lastPlayedCard'] = (int)$this->getGameStateValue('lastPlayedCard');
        $result['lastPlayedTarget'] = (int)$this->getGameStateValue('lastPlayedTarget');

        // For type-3 (secret) cards: map card_id → target_player_id so client can show/hide question
        $result['secretCardTargets'] = [];
        foreach ($result['commonarea'] as $card) {
            if ((int)$card['type'] === 3) {
                $cardId = (int)$card['id'];
                if ($cardId === $result['lastPlayedCard'] && $result['lastPlayedTarget'] > 0) {
                    $result['secretCardTargets'][$cardId] = $result['lastPlayedTarget'];
                } else {
                    $target = $this->getUniqueValueFromDB(
                        "SELECT player_id FROM qcard_answer WHERE card_id = $cardId LIMIT 1"
                    );
                    if ($target) {
                        $result['secretCardTargets'][$cardId] = (int)$target;
                    }
                }
            }
        }

        return $result;
    }

    protected function getGameName() {
        return "knightsandknaves";
    }

    //////////////////////////////////////////////////////////////////
    // Game Setup
    //////////////////////////////////////////////////////////////////

    protected function setupNewGame($players, $options = []) {
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        // Init global values
        $this->setGameStateInitialValue('lastPlayedCard', 0);
        $this->setGameStateInitialValue('lastPlayedTarget', 0);

        // Create question card deck (2 types × 18 questions = 36 cards)
        $qcards = [];
        foreach (self::$QCARD_TYPES as $type => $type_info) {
            foreach (self::$QCARD_QUESTIONS as $qindex => $question) {
                $qcards[] = ['type' => $type, 'type_arg' => $qindex, 'nbr' => 1];
            }
        }
        $this->qcards->createCards($qcards, 'qdeck');
        $this->qcards->shuffle('qdeck');

        // Create identity cards: 10 knights and 10 knaves
        $kcards = [];
        for ($i = 1; $i <= 10; $i++) {
            $kcards[] = ['type' => 'knight', 'type_arg' => $i, 'nbr' => 1];
            $kcards[] = ['type' => 'knave', 'type_arg' => $i, 'nbr' => 1];
        }
        $this->kcards->createCards($kcards, 'kdeck');

        // Create number cards 1-10
        $ncards = [];
        for ($i = 1; $i <= 10; $i++) {
            $ncards[] = ['type' => 'idnumber', 'type_arg' => $i, 'nbr' => 1];
        }
        $this->ncards->createCards($ncards, 'ndeck');
        $this->ncards->shuffle('ndeck');

        // Alternating identity deal per rules:
        // Separate into knight pile and knave pile, shuffle each
        $knight_cards = $this->kcards->getCardsOfType('knight');
        $knave_cards = $this->kcards->getCardsOfType('knave');
        $knight_ids = array_keys($knight_cards);
        $knave_ids = array_keys($knave_cards);
        shuffle($knight_ids);
        shuffle($knave_ids);

        // Alternately pick from each pile until we have (num_players + 1) cards
        $num_players = count($players);
        $deal_pile = [];
        $ki = 0; $kni = 0;
        $pick_knight = true;
        while (count($deal_pile) < $num_players + 1) {
            if ($pick_knight && $ki < count($knight_ids)) {
                $deal_pile[] = $knight_ids[$ki++];
            } elseif (!$pick_knight && $kni < count($knave_ids)) {
                $deal_pile[] = $knave_ids[$kni++];
            } else {
                // Fallback if one pile runs out
                if ($ki < count($knight_ids)) {
                    $deal_pile[] = $knight_ids[$ki++];
                } elseif ($kni < count($knave_ids)) {
                    $deal_pile[] = $knave_ids[$kni++];
                }
            }
            $pick_knight = !$pick_knight;
        }

        // Shuffle the deal pile and deal one to each player
        shuffle($deal_pile);
        $player_ids = array_keys($players);
        for ($i = 0; $i < $num_players; $i++) {
            $this->kcards->moveCard($deal_pile[$i], 'hand', $player_ids[$i]);
        }
        // Last card stays face down (remains in kdeck)

        // Deal 5 question cards and 1 number card to each player
        $players_info = $this->loadPlayersBasicInfos();
        foreach ($players_info as $player_id => $player) {
            $this->qcards->pickCards(5, 'qdeck', $player_id);
            $this->ncards->pickCards(1, 'ndeck', $player_id);
        }

        // Activate first player
        $this->activeNextPlayer();

        // Init statistics
        $this->initStat('table', 'turns_number', 0);
        $this->initStat('player', 'turns_number', 0);
        $this->initStat('player', 'questions_asked', 0);
        $this->initStat('player', 'correct_guesses', 0);
        $this->initStat('player', 'wrong_guesses', 0);
    }

    //////////////////////////////////////////////////////////////////
    // Zombie handling
    //////////////////////////////////////////////////////////////////

    protected function zombieTurn(array $state, int $active_player): void {
        $state_name = $state["name"];

        if ($state["type"] === "activeplayer") {
            switch ($state_name) {
                case 'playerTurnAsk':
                    $this->actDiscardAndRedraw();
                    break;
                case 'playerTurnGuess':
                    $this->actPass();
                    break;
                default: {
                    $this->gamestate->nextState("nextPlayer");
                    break;
                }
            }
            return;
        }

        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new \feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }
}
