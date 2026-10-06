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
            "guessTarget" => 12,
            // Game option 100: 1 = standard, 2 = everyone may join a guess
            "guessingRule" => 100,
        ));

        $this->qcards = $this->getNew("module.common.deck");
        $this->qcards->init("qcard");
        // When the draw pile runs out, shuffle the discarded (redrawn) hands back
        // into it. Played questions stay on the table, so they never come back.
        $this->qcards->autoreshuffle = true;
        $this->qcards->autoreshuffle_custom = ['qdeck' => 'discard'];
        $this->qcards->autoreshuffle_trigger = ['obj' => $this, 'method' => 'onQuestionDeckReshuffled'];
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
            18 => ['description' => clienttranslate('Is your number even?'), 'code' => '1010101010'],
            19 => ['description' => clienttranslate('Is your number odd?'), 'code' => '0101010101'],
            20 => ['description' => clienttranslate('Is your number a multiple of 3?'), 'code' => '0100100100'],
            21 => ['description' => clienttranslate('Is your number a multiple of 4?'), 'code' => '0010001000'],
            22 => ['description' => clienttranslate('Is your number a multiple of 5?'), 'code' => '1000010000'],
            23 => ['description' => clienttranslate('Is your number prime?'), 'code' => '0001010110'],
            24 => ['description' => clienttranslate('Is your number square?'), 'code' => '0100001001'],
            25 => ['description' => clienttranslate('Is your number (strictly) between 3 and 7?'), 'code' => '0000111000'],
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
            $target_revealed = $this->getUniqueValueFromDB("SELECT player_revealed FROM player WHERE player_id = '$target_id'");
            if ($target_revealed) {
                throw new \BgaUserException("That player's identity has already been revealed");
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
        $this->validateGuess($player_id, $target_id, $tribe, $number);
        $target_name = $this->getPlayerNameById($target_id);

        if ($this->everyoneMayJoinGuesses()) {
            // The guess stays secret so nobody can just copy it: everyone else
            // gets their chance to guess the same target (joinGuess), then all
            // the guesses are revealed together (stResolveGuess).
            $this->DbQuery("DELETE FROM pending_guess");
            $this->DbQuery("INSERT INTO pending_guess (player_id, tribe, `number`, is_primary) VALUES ($player_id, '$tribe', $number, 1)");
            $this->setGameStateValue('guessTarget', $target_id);
            $this->notify->all('guessDeclared', clienttranslate('${player_name} makes a secret guess about the identity of ${target_name}'), [
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'target_id' => $target_id,
                'target_name' => $target_name,
            ]);
            $this->gamestate->nextState('joinGuess');
            return;
        }

        $identity = $this->getIdentity($target_id);
        $guessCorrect = ($identity['tribe'] === $tribe && $identity['number'] === $number);
        $wrong_guesses = $this->scoreGuess($player_id, $guessCorrect, 1);

        if ($guessCorrect) {
            $this->revealIdentity($target_id);

            $this->notify->all('guessCorrect', clienttranslate('${player_name} correctly guesses that ${target_name} is a ${tribe} with number ${number}! ${target_name}\'s identity is revealed.'), [
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'target_id' => $target_id,
                'target_name' => $target_name,
                'tribe' => $tribe,
                'number' => $number,
            ]);

            $this->notifyScores();
        } else {
            $this->notify->all('guessIncorrect', clienttranslate('${player_name} incorrectly guesses that ${target_name} is a ${tribe} with number ${number}.'), [
                'player_id' => $player_id,
                'player_name' => $this->getActivePlayerName(),
                'target_id' => $target_id,
                'target_name' => $target_name,
                'tribe' => $tribe,
                'number' => $number,
                'wrong_guesses' => $wrong_guesses,
            ]);
        }

        $this->gamestate->nextState($this->allIdentitiesRevealed() ? 'endGame' : 'nextPlayer');
    }

    // "Everyone may join a guess" option: guess the identity of the player the
    // active player just guessed about. Like theirs, it stays secret until
    // every guess is revealed together.
    function actJoinGuess(string $tribe, int $number) {
        $this->checkAction('actJoinGuess');
        $player_id = (int) $this->getCurrentPlayerId();
        $target_id = (int) $this->getGameStateValue('guessTarget');
        $this->validateGuess($player_id, $target_id, $tribe, $number);

        $this->DbQuery("INSERT INTO pending_guess (player_id, tribe, `number`) VALUES ($player_id, '$tribe', $number)");
        $this->gamestate->setPlayerNonMultiactive($player_id, 'resolveGuess');
    }

    // Whether a player joined or declined also stays secret until the reveal.
    function actDeclineGuess() {
        $this->checkAction('actDeclineGuess');
        $this->gamestate->setPlayerNonMultiactive((int) $this->getCurrentPlayerId(), 'resolveGuess');
    }

    function actPass() {
        $player_id = (int) $this->getActivePlayerId();
        $this->notify->all('actPass',clienttranslate('${player_name} ends their turn'), [
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
        ]);
        $this->gamestate->nextState('nextPlayer');
    }

    function actDiscardAndRedraw() {
        $player_id = (int) $this->getActivePlayerId();
        $this->qcards->moveAllCardsInLocation('hand', 'discard', $player_id);
        $newCards = $this->drawQuestionCards(5, $player_id);

        $this->notify->player($player_id, 'newHand', '', ['cards' => $newCards]);
        $this->notify->all('actDiscardAndRedraw', clienttranslate('${player_name} discards their hand and draws new cards'), [
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
        ]);

        // Redrawing replaces asking a question, but the player still gets their
        // chance to guess before the turn passes on.
        $this->gamestate->nextState('guessPhase');
    }

    // Draws up to $count question cards for a player, as many as the draw pile
    // and discard pile hold between them (the deck reshuffles the discard pile
    // in automatically if the draw pile runs out mid-draw).
    private function drawQuestionCards(int $count, int $player_id): array {
        $available = $this->qcards->countCardInLocation('qdeck') + $this->qcards->countCardInLocation('discard');
        $count = min($count, $available);
        if ($count <= 0) return [];
        return $this->qcards->pickCards($count, 'qdeck', $player_id) ?? [];
    }

    // Deck autoreshuffle_trigger callback.
    public function onQuestionDeckReshuffled($location = null) {
        $this->notify->all('questionDeckReshuffled', clienttranslate('The question deck is empty, so the discarded cards are shuffled to form a new deck'), []);
    }

    private function everyoneMayJoinGuesses(): bool {
        return (int) $this->getGameStateValue('guessingRule') === 2;
    }

    // Throws unless $player_id may guess that $target_id is a $tribe with number $number.
    private function validateGuess(int $player_id, int $target_id, string $tribe, int $number): void {
        if ($target_id === $player_id) {
            throw new \BgaUserException("You cannot guess your own identity");
        }
        if (($tribe !== 'knight' && $tribe !== 'knave') || $number < 1 || $number > 10) {
            throw new \BgaUserException("A guess must be a knight or knave with a number from 1 to 10");
        }
        $target_revealed = $this->getUniqueValueFromDB("SELECT player_revealed FROM player WHERE player_id = $target_id");
        if ($target_revealed === null) {
            throw new \BgaUserException("That player is not in this game");
        }
        if ($target_revealed) {
            throw new \BgaUserException("That player's identity has already been revealed");
        }
    }

    // A player's tribe ('knight' or 'knave') and number (1-10).
    private function getIdentity(int $player_id): array {
        $number = (int)$this->getUniqueValueFromDB("SELECT card_type_arg FROM ncard WHERE card_location_arg = $player_id LIMIT 1");
        $tribe = $this->getUniqueValueFromDB("SELECT card_type FROM kcard WHERE card_location_arg = $player_id LIMIT 1");
        if ($number === 0 || $tribe === null) {
            throw new \BgaUserException("Target player's identity cards not found");
        }
        return ['tribe' => $tribe, 'number' => $number];
    }

    // Scores one guess and returns the guesser's number of wrong guesses (X's).
    // A correct guess earns the guesser $points. A wrong one scores nothing for
    // anybody (being falsely accused earns nothing), but we track the guesser's
    // incorrect-guess count: it's the tiebreaker between players who end the
    // game with the same score (fewer wrong guesses wins), via player_score_aux
    // (higher = better, so we store its negative).
    private function scoreGuess(int $player_id, bool $correct, int $points): int {
        if ($correct) {
            $this->DbQuery("UPDATE player SET player_trophies = player_trophies + $points, player_score = player_score + $points WHERE player_id = $player_id");
            $this->incStat(1, 'correct_guesses', $player_id);
        } else {
            $this->incStat(1, 'wrong_guesses', $player_id);
        }
        $wrong_guesses = (int)$this->getStat('wrong_guesses', $player_id);
        $this->DbQuery("UPDATE player SET player_score_aux = -$wrong_guesses WHERE player_id = $player_id");
        return $wrong_guesses;
    }

    // After a correct guess, the target's identity becomes public knowledge, but
    // the target stays in the game and can keep asking questions and making
    // guesses of their own.
    private function revealIdentity(int $target_id): void {
        $this->DbQuery("UPDATE player SET player_revealed = 1 WHERE player_id = $target_id");

        // The target's identity cards are no longer a secret to keep in hand;
        // move them out so they disappear from the target's private display.
        $tribe_card = array_values($this->kcards->getCardsInLocation('hand', $target_id))[0];
        $this->kcards->moveCard($tribe_card['id'], 'revealed', $target_id);
        $number_card = array_values($this->ncards->getCardsInLocation('hand', $target_id))[0];
        $this->ncards->moveCard($number_card['id'], 'revealed', $target_id);
    }

    // The game ends once every player's identity has been revealed.
    private function allIdentitiesRevealed(): bool {
        return (int)$this->getUniqueValueFromDB("SELECT COUNT(*) FROM player WHERE player_revealed = 0") == 0;
    }

    private function notifyScores(): void {
        $newScores = $this->getCollectionFromDb("SELECT player_id, player_score FROM player", true);
        $this->notify->all("newScores", '', ['newScores' => $newScores]);
    }

    //////////////////////////////////////////////////////////////////
    // Game Progression
    //////////////////////////////////////////////////////////////////

    public function getGameProgression() {
        $total = $this->getUniqueValueFromDB("SELECT COUNT(*) FROM player");
        $revealed = $this->getUniqueValueFromDB("SELECT COUNT(*) FROM player WHERE player_revealed = 1");
        if ($total == 0) return 0;
        return (int)(($revealed / $total) * 100);
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
            // Ask all: activate everyone except the asker and revealed players
            // (their identity is already public, so there's nothing left to ask them)
            $this->gamestate->setAllPlayersMultiactive();
            $this->gamestate->setPlayerNonMultiactive($active_player_id, 'reportAnswer');
            $revealed = $this->getCollectionFromDb("SELECT player_id FROM player WHERE player_revealed = 1");
            foreach ($revealed as $pid => $row) {
                $this->gamestate->setPlayerNonMultiactive($pid, 'reportAnswer');
            }
        }
    }

    function argJoinGuess(): array
    {
        $target_id = (int) $this->getGameStateValue('guessTarget');
        return [
            'guesser_id' => (int) $this->getActivePlayerId(),
            'target_id' => $target_id,
            'target_name' => $this->getPlayerNameById($target_id),
        ];
    }

    // Everyone but the guesser and the target may join the guess, including
    // players whose own identity has already been revealed. With nobody else
    // (a 2-player game), this goes straight on to the reveal.
    function stJoinGuess()
    {
        $guesser_id = (int) $this->getActivePlayerId();
        $target_id = (int) $this->getGameStateValue('guessTarget');
        $joiners = [];
        foreach ($this->loadPlayersBasicInfos() as $pid => $player) {
            $pid = (int) $pid;
            if ($pid !== $guesser_id && $pid !== $target_id) {
                $joiners[] = $pid;
                $this->giveExtraTime($pid);
            }
        }
        $this->gamestate->setPlayersMultiactive($joiners, 'resolveGuess', true);
    }

    // Reveals and scores every guess made about the target: 2 points for the
    // active player's guess if it's right, 1 point for anyone else's, and an X
    // for any wrong guess. If anyone was right, the target's identity is revealed.
    function stResolveGuess()
    {
        $guesser_id = (int) $this->getActivePlayerId();
        $target_id = (int) $this->getGameStateValue('guessTarget');
        $target_name = $this->getPlayerNameById($target_id);
        $identity = $this->getIdentity($target_id);
        $guesses = $this->getCollectionFromDb("SELECT player_id, tribe, `number`, is_primary FROM pending_guess");

        $results = [];
        $declined = [];
        $any_correct = false;
        // Go around the table in turn order, starting with the active player.
        $next_player = $this->getNextPlayerTable();
        $player_id = $guesser_id;
        do {
            if ($player_id !== $target_id) {
                $guess = $guesses[$player_id] ?? null;
                if ($guess === null) {
                    $declined[] = $player_id;
                    $this->notify->all('guessRevealed', clienttranslate('${player_name} chose not to guess'), [
                        'player_id' => $player_id,
                        'player_name' => $this->getPlayerNameById($player_id),
                    ]);
                } else {
                    $tribe = $guess['tribe'];
                    $number = (int) $guess['number'];
                    $correct = ($tribe === $identity['tribe'] && $number === $identity['number']);
                    $points = $guess['is_primary'] ? 2 : 1;
                    $wrong_guesses = $this->scoreGuess($player_id, $correct, $points);
                    $any_correct = $any_correct || $correct;
                    $results[] = [
                        'player_id' => $player_id,
                        'tribe' => $tribe,
                        'number' => $number,
                        'correct' => $correct,
                        'points' => $correct ? $points : 0,
                        'wrong_guesses' => $wrong_guesses,
                    ];

                    if (!$correct) {
                        $message = clienttranslate('${player_name} incorrectly guessed that ${target_name} is a ${tribe} with number ${number}');
                    } elseif ($points == 2) {
                        $message = clienttranslate('${player_name} correctly guessed that ${target_name} is a ${tribe} with number ${number} and scores 2 points');
                    } else {
                        $message = clienttranslate('${player_name} correctly guessed that ${target_name} is a ${tribe} with number ${number} and scores 1 point');
                    }
                    $this->notify->all('guessRevealed', $message, [
                        'player_id' => $player_id,
                        'player_name' => $this->getPlayerNameById($player_id),
                        'target_id' => $target_id,
                        'target_name' => $target_name,
                        'tribe' => $tribe,
                        'number' => $number,
                    ]);
                }
            }
            $player_id = (int) $next_player[$player_id];
        } while ($player_id !== $guesser_id);

        if ($any_correct) {
            $this->revealIdentity($target_id);
            $message = clienttranslate('${target_name}\'s identity is revealed: a ${tribe} with number ${number}');
        } else {
            $message = clienttranslate('Nobody guessed correctly, so the identity of ${target_name} stays secret');
        }
        // Only send the identity itself if it's now public.
        $this->notify->all('guessesRevealed', $message, [
            'target_id' => $target_id,
            'target_name' => $target_name,
            'tribe' => $any_correct ? $identity['tribe'] : null,
            'number' => $any_correct ? $identity['number'] : null,
            'results' => $results,
            'declined' => $declined,
        ]);
        $this->notifyScores();

        $this->DbQuery("DELETE FROM pending_guess");
        $this->setGameStateValue('guessTarget', 0);

        $this->gamestate->nextState($this->allIdentitiesRevealed() ? 'endGame' : 'nextPlayer');
    }

    function stNextPlayer()
    {
        // Draw cards for the current active player to replenish to 5
        $current_player_id = (int) $this->getActivePlayerId();
        $hand_count = $this->qcards->countCardInLocation('hand', $current_player_id);
        if ($hand_count < 5) {
            $newCards = $this->drawQuestionCards(5 - $hand_count, $current_player_id);
            if (count($newCards) > 0) {
                $this->notify->player($current_player_id, 'cardsDrawn', '', ['cards' => $newCards]);
            }
        }

        $player_id = (int) $this->activeNextPlayer();

        // The game ends once every player's identity has been revealed.
        $unrevealed = $this->getObjectListFromDB("SELECT player_id FROM player WHERE player_revealed = 0", true);
        if (count($unrevealed) == 0) {
            $this->gamestate->nextState("endGame");
        } else {
            // The last player whose identity is still secret has nobody left to
            // question or guess (revealed players can't be targeted), so skip
            // their turn. The next player is necessarily revealed and can still
            // go after them.
            if (count($unrevealed) == 1 && (int)$unrevealed[0] === $player_id) {
                $this->notify->all('turnSkipped', clienttranslate('${player_name} is the only player whose identity is still secret, so their turn is skipped'), [
                    'player_id' => $player_id,
                    'player_name' => $this->getPlayerNameById($player_id),
                ]);
                $player_id = (int) $this->activeNextPlayer();
            }

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
            "SELECT `player_id`, `player_revealed` `revealed`, `player_trophies` `trophies` FROM `player`"
        );
        foreach ($result["players"] as $pid => &$player) {
            $player['revealed'] = $extra[$pid]['revealed'] ?? 0;
            $player['trophies'] = $extra[$pid]['trophies'] ?? 0;
            $player['wrongGuesses'] = $this->getStat('wrong_guesses', (int)$pid);
        }
        unset($player);

        // Cards in player hand
        $result['hand'] = $this->qcards->getCardsInLocation('hand', $current_player_id);

        // Cards played on the table
        $result['commonarea'] = $this->qcards->getCardsInLocation('commonarea');

        // Player's identity cards (private)
        $result['idtribe'] = $this->kcards->getCardsInLocation('hand', $current_player_id);
        $result['idnumber'] = $this->ncards->getCardsInLocation('hand', $current_player_id);

        // Identities that have been publicly revealed by a correct guess are visible to everyone
        $result['revealedIdentities'] = [];
        foreach ($this->kcards->getCardsInLocation('revealed') as $card) {
            $pid = (int)$card['location_arg'];
            $result['revealedIdentities'][$pid]['tribe'] = $card['type'];
        }
        foreach ($this->ncards->getCardsInLocation('revealed') as $card) {
            $pid = (int)$card['location_arg'];
            $result['revealedIdentities'][$pid]['number'] = (int)$card['type_arg'];
        }

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

        // "Everyone may join a guess" option, and this player's own secret guess
        // while the others are still deciding whether to join (null if none)
        $result['everyoneMayJoinGuesses'] = $this->everyoneMayJoinGuesses();
        $result['pendingGuess'] = $this->getObjectListFromDB(
            "SELECT tribe, `number` FROM pending_guess WHERE player_id = $current_player_id"
        )[0] ?? null;

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

        // Only the asker and the target of a secret question may see what it
        // was; everyone else gets the same hidden index the live notification sends.
        foreach ($result['commonarea'] as $cardId => &$card) {
            if ((int)$card['type'] !== 3) continue;
            $asker_id = (int)$card['location_arg'];
            $target_id = $result['secretCardTargets'][$cardId] ?? 0;
            if ($current_player_id !== $asker_id && $current_player_id !== $target_id) {
                $card['type_arg'] = -1;
            }
        }
        unset($card);

        return $result;
    }

    protected function getGameName() {
        return "knightsandknaves";
    }

    // Our colorblind-friendly palette doesn't match BGA's favorite colors, so
    // map each favorite to the closest game color ourselves.
    public function getSpecificColorPairings(): array {
        return [
            "ff0000" /* Red */ => "cc3311",
            "008000" /* Green */ => "009e73",
            "0000ff" /* Blue */ => "0072b2",
            "ffa500" /* Yellow */ => "d09000",
            "000000" /* Black */ => "000000",
            "ffffff" /* White */ => null,
            "e94190" /* Pink */ => "882255",
            "982fff" /* Purple */ => "882255",
            "72c3b1" /* Cyan */ => "009e73",
            "f07f16" /* Orange */ => "d09000",
            "bdd002" /* Khaki green */ => "009e73",
            "7b7b7b" /* Gray */ => "000000",
        ];
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
        $this->setGameStateInitialValue('guessTarget', 0);

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
