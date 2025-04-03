# Notes


Important: always rebuild before testing.  Run `npm run build` in the project directory.  Or `npm run watch` to have it rebuild automatically.

The `states.inc.php` file should not be edited.  Instead, use the `source/shared/gamestates.jsonc` file, which will be used to automatically generate the `states.inc.php` file.

As of 2025-04-03, we have replaced `knightsandknaves.game.php` with `moduels/php/Game.php`.  This is the modern workflow and doesn't use the `knightsandknaves.actions.php` file (now deleted).  See the hearts tutorial files at https://github.com/elaskavaia/bga-heartsla/blob/main/heartslav.js.


## Next steps:

- [ ] Create an interface for the response phase of a game.

For keeping track of answers, use thumbs up or down using unicode for the symbol, colors meaning the player's color.  This will be displayed on the card in the common area. 

## Rules

Knights and Knaves (the Game!?) is a competitive guessing game with cards for 2-6 players, ages 10+.  Each player takes on the role of either a KNIGHT (who always tells the truth), or a KNAVE (who always lies).  Each player has a secret number that their opponents must try to guess by asking you questions.  But will you answer truthfully?  Or are you a knave?

Components:

- 20 identity cards: 10 knights and 10 knaves, each with a different number from 1-10.
- 73 question cards used to ask yes/no questions of your opponents.
Note cards for each player to keep track of what they know
- 36 proof tokens/mini cards used to keep track of answers and verify wins
- 6 Pencils/Quills

Objective: Correctly guess the identity of the most number of players.

Setup:

- Separate the identity cards into a stack of knights and a stack of knaves, and shuffle each stack separately.  Without looking, alternately deal cards from each stack until you have dealt a number of cards equal to one more than the number of players.  For example, if you are playing with 4 players, you will end with a stack of two knights and three knaves, or three knights and two knaves, but nobody will know the numbers of these identity cards.  Shuffle this smaller stack and deal out the cards to the players, leaving the last one face down in the center.
- Note: In a 2-player game, deal into a stack 1 knight and 1 knave card.  Then, shuffling the entire k-k deck, deal one more onto the stack.  Then deal out the identities.
- Shuffle the question cards and deal 5(?) to each player.  The remaining question cards are placed in a draw pile in the center of the table.
Each player takes a note card and writing quill, as well as all of the proof tokens of their favorite color.
(Optionally: deal out some number of the remaining identity cards after shuffling them for each player to gain some secret information)

On your turn:

- Play a question card from your hand.  This will either result in you asking one or more players a yes/no question, which they either answer publicly, or in secret.  See below.
- Optionally, make a guess as to any player’s identity.
- Take a new question card or cards from the draw pile to bring your total back to 5.
- Instead of playing a question card from your hand, you can discard all your cards and redraw at the end of your turn.

Asking & Answering a Question:

- Public Questions: Most question cards (those without any additional text) are used to publicly ask one player a question.  For such cards, announce which player you are asking the question of, and read the question out loud.  The targeted player responds with either “Yes” or “No,” consistent with their identity (knights tell the truth, and knaves lie).  You then place the card face up in the middle of the table and the targeted player places one of their proof tokens on your card, with a Y or N face up (according to their answer).
- “Ask All” Questions: Some cards have an “Ask All” symbol on them.  When you play these cards, all players must respond to your question (consistent with their identities) and place their proof tokens on the card accordingly.
- “Ask in Secret” Questions: Some cards have an “Ask in Secret” symbol.  For these, do NOT ask the question out loud.  Instead, pass the card to the player you want to hear from.  They publicly announce either Yes or No, but since the two of you know the question, other players do not gain information from this question.  Keep the card next to you, face down, with the other players proof token on top, oriented accordingly.

Making a Guess:

- After playing a question card, you have the option to guess an opponent's identity.  You publicly accuse them of having a number and persuasion.  If you are right, they reveal their identity card and pass it to you to keep as a trophy.  However, if you are incorrect, they say “NOOOOO” and you are out of the game.  Give them your identity card (face down or face up?), which they keep as a trophy.
- Either way, one player is now out of the game.  They cannot make any more guesses or ask any more questions.  But for fun, they can still try to deduce other players’ identity.

Game end: The game ends when all but one player is eliminated.  At this point, the player who has the most trophies, counting their own identity card, if they still have it, is the winner.

## Game display (Layout)

The display will be determined through a combination of the *.tpl file, the .js file, and the .css file.  The .tpl file will be used to generate the html file, which will be styled by the .css file.  The .js file will be used to dynamically update the html file.

We can define some new divs: maybe one for the current played card, and another for the history.

### Common area

- Each played question card is displayed.
- When a player answers the question, their colored "chip" is placed on the card in the appropriate region.
- Indicate which player asked the question?
- Indication of current players (those who have not been eliminated).
- Current score for all players (number of "trophies" they have).
- Display wild-card text
- Optional:
  - Hint button on each card. When clicked, show how a yes or no answer should work for your notecard.

### Player area

- Hand of question cards
  - When you play a question card, you need to specify who you ask.  You click on the card, a popup asks for target player.  Some way to exit this and pick another card if you change your mind.
- ID cards/information
  - Deal a persuasion (camp?) card to each player (knight or knave) and a number card (1-10) to each player.  Display these to the left of the player hand.
- When a player is asked a question, we need a Yes/No button for them to click.
  - We will check whether the player answers "correctly", but they have to click the button.
- Semi-Optional: Notecard
  - players can click on region at anytime to cross out possibility.
  - Will not interact with server.
  - Tab feature to see player-specific notes

### Question Cards

- Wild Cards:
  - For now, the player selects which numbers to ask about.  "Is your number in the set {-,-,-,-}?"
  - Then this is displayed for the player to answer and preserved in the common area.
- Answer-in-Secret Cards (could be wild?):
  - These will be only displayed to the asker and answerer.  The rest of the players will see the answer (yes/no) on the face-down card in the common area.
- Ask-One/Ask-All Cards (includes standard cards & wild):
  - Just an implementation issue
- Optional: Card "Actions":
  - How do we interrupt the game?

## Game states

### General notes

Each state includes an array of possible actions.  These correspond to the names of functions in *.game.php.  This function does stuff, and then sets `$this->gamestate->nextState( "x" );` where "x" is one of the possible transitions keys.  The value of that key is the number of the next state in `states.inc.php`.

In the .js file we can report what is happening using console.log, and view that using the chrome inspector.

- Game setup
  - Assign identities
  - Deal question cards
- Player turn
  - Active player:
    - Banner at top has buttons/instructions for possible actions: Ask (play a card) or Guess.
      - If guess: show buttons for each player.  When a player is clicked, buttons for knight or knave and number.  When these are selected, buttons for "confirm" and "cancel" appear.  Confirm will check and resolve (notify and give points).  If correct, the player gets a "trophy" placed in their bga player info card (top right of screen).
      - if ask: First click on a question card in your hand.  This highlights the card and displays a popup menu with the different players you can play the card "on" or that says "ask all".  Once you make a selection, you confirm with a button on top.
  - Asked player(s):
    - When the active player asks a question of you, you get a popup with a yes/no button.  Only the "correct" answer is clickable. A timer will answer for you if you don't respond. (Should you have to say yes/no, and get some penalty when you click the wrong one, or take too long?) You click this to answer the question.  The card is then displayed in the common area with your colored chip on it (top for yes, bottom for no).
      - The card is displayed in the center of the common array, larger.  Answering players click on the "yes" or "no" region of the card to place their chip.  (If they are wrong, then the game "corrects" it for them.)
  - After everyone has answered, the card goes to the main common area, still displaying its chips.
  - Active player has the option to guess or end their turn.  If they guess, see above.  If end turn, go to next player and repeat.


  - wait for current player to ask question
    - move to wait for answers, or
    - wait for current player to identify target player
      - move to wait for answer, or
    - wait for current player to assign numbers for wild card
      - move to wait for answer
  - wait for target player(s) to answer
  - game updates play area
  - wait for current player to guess or pass
    - if guess, game determines if correct and resolves accordingly (award trophies, eliminate player, etc.)
    - Possibly move to end game state.
  - transition to next player

- Game end
  - Display winner
  - Display trophies for all players.

## Question card coding

- Cards have properties in the database:
  - ID
  - type: describe what the card should do (is it 'default', 'wild', 'ask_all', 'ask_secret', 'special').
  - type_arg: 
    - n: "is your number in the set coded by the binary representation of n".
    - We should write a parsing function that converts English descriptions to the codes that can then be passed around by the program.  ex: `code('less' 5) = 15`, `code('between', 3, 6) = 48`, `code('in', [1,2,3,4,5]) = 31`
  - location: 'deck', 'hand', 'discard' (these are standard), we can add, 'asked'
  - location_arg: int but this can mean something different depending on location
    - deck: 0
    - hand: player_id
    - discard: 0
    - asked: code for who replied and how.
- To link these up with the js and the images of the cards, we will have a sprite image that has rows for each card type and columns for each type_arg.  Some rows will be long, but others will be short.


## Card design (art)

## Implement js stuff (interface, animation, etc.)

## Implement database

## TODOs
- look into common area display template in docs.