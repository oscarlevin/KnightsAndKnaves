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

const NUM_QUESTION_TYPES = 3; // ask-one, ask-all, ask-in-secret
const NUM_QUESTIONS = 18;

class KnightsAndKnaves extends Gamegui
{
	cardwidth: number;
	cardheight: number;
	handCardWidth: number;
	handCardHeight: number;
	playerHand: any;
	commonArea: any;
	playerTribe: any;
	playerNumber: any;
	currentState: string;
	cardDataById: Record<string, { type: string; type_arg: string }>;
	currentQuestionCardId: string | null;
	currentQuestionTargetId: string | null;
	currentQuestionAskerId: string | null;
	secretCardTargets: Record<string, number>;
	cardAnswers: Record<string, { playerId: string; answer: string; color: string }[]>;
	playedQuestionAskers: Record<string, string>;
	previewSource: 'hand' | 'commonarea' | null;
	previewMode: 'play' | 'inspect' | null;
	// "Everyone may join a guess" option: the guess being joined, and this
	// player's own secret guess about it until all guesses are revealed.
	joinGuessArgs: { guesser_id: number; target_id: number; target_name: string } | null;
	pendingGuess: { tribe: string; number: number } | null;

	constructor(){
		super();
		this.cardwidth = 72;
		this.cardheight = 96;
		this.handCardWidth = 82;
		this.handCardHeight = 109;
		this.currentState = '';
		this.cardDataById = {};
		this.currentQuestionCardId = null;
		this.currentQuestionTargetId = null;
		this.currentQuestionAskerId = null;
		this.secretCardTargets = {};
		this.cardAnswers = {};
		this.playedQuestionAskers = {};
		this.previewSource = null;
		this.previewMode = null;
		this.joinGuessArgs = null;
		this.pendingGuess = null;
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
						<span class="kk_wrong_icon">❌</span>
						<span id="wrong_count_${player_id}" class="kk_wrong_count">${(player as any).wrongGuesses || 0}</span>
					</div>`,
					playerBoardDiv
				);
				dojo.place(this.renderPlayerNotesPanel(), playerBoardDiv);
			}
		}

		// Player hand stock
		this.playerHand = new ebg.stock();
		this.playerHand.create( this, $('myhand'), this.handCardWidth, this.handCardHeight );
		this.playerHand.setSelectionMode(1);
		this.playerHand.image_items_per_row = 1;
		this.playerHand.item_margin = 4;

		// Common area stock
		this.commonArea = new ebg.stock();
		this.commonArea.create( this, $('commonarea'), this.cardwidth, this.cardheight );
		this.commonArea.setSelectionMode(0);
		this.commonArea.image_items_per_row = 1;
		this.commonArea.item_margin = 4;

		// Player tribe card stock
		this.playerTribe = new ebg.stock();
		this.playerTribe.create( this, $('myTribe'), this.cardwidth, this.cardheight );
		this.playerTribe.setSelectionMode(0);
		this.playerTribe.image_items_per_row = 1;
		this.playerTribe.item_margin = 4;

		// Player number card stock
		this.playerNumber = new ebg.stock();
		this.playerNumber.create( this, $('myNumber'), this.cardwidth, this.cardheight );
		this.playerNumber.setSelectionMode(0);
		this.playerNumber.image_items_per_row = 1;
		this.playerNumber.item_margin = 4;

		// Use card.png as the fallback background for all stocks
		const cardImg = g_gamethemeurl + 'img/card.png';
		this.playerHand.addItemType(0, 0, cardImg, 0);
		this.commonArea.addItemType(0, 0, cardImg, 0);
		this.playerTribe.addItemType(0, 0, cardImg, 0);
		this.playerNumber.addItemType(0, 0, cardImg, 0);

		// Inject overlays onto question cards
		const questions = (gamedatas as any).questions as Record<number, { description: string; code: string }>;
		const extractCardId = (divId: string) => divId.split('_item_')[1] ?? divId;
		const typeClassMap: Record<number, string> = { 1: 'kk_card_ask_one', 2: 'kk_card_ask_all', 3: 'kk_card_ask_secret' };
		const typeIconMap: Record<number, string> = { 1: '', 2: '👥', 3: '🔇' };
		const typeNameMap: Record<number, string> = { 1: 'Ask one player', 2: 'Ask all players', 3: 'Ask in secret' };

		this.playerHand.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const cardId = extractCardId(divId);
			const data = this.cardDataById[cardId];
			const cardType = data ? parseInt(data.type) : 1;
			const text = data ? (questions[parseInt(data.type_arg)]?.description ?? '') : '';
			cardDiv.style.removeProperty('left');
			dojo.addClass(cardDiv, typeClassMap[cardType] ?? 'kk_card_ask_one');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_type_icon" title="${typeNameMap[cardType] ?? 'Ask one player'}" aria-label="${typeNameMap[cardType] ?? 'Ask one player'}">${typeIconMap[cardType] ?? '👤'}</div>` +
				`<div class="kk_card_content">${text}</div>`
			);
			this.fitCardTextDeferred(cardDiv.querySelector('.kk_card_content') as HTMLElement | null);
		};
		this.commonArea.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const cardId = extractCardId(divId);
			const data = this.cardDataById[cardId];
			const cardType = data ? parseInt(data.type) : 1;
			const text = data ? (questions[parseInt(data.type_arg)]?.description ?? '') : '';
			cardDiv.style.removeProperty('left');
			dojo.addClass(cardDiv, typeClassMap[cardType] ?? 'kk_card_ask_one');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_type_icon" title="${typeNameMap[cardType] ?? 'Ask one player'}" aria-label="${typeNameMap[cardType] ?? 'Ask one player'}">${typeIconMap[cardType] ?? '👤'}</div>` +
				`<div class="kk_card_content">${text}</div>`
			);
			this.fitCardTextDeferred(cardDiv.querySelector('.kk_card_content') as HTMLElement | null);
			dojo.connect(cardDiv, 'onclick', (evt: MouseEvent) => {
				dojo.stopEvent(evt);
				this.openQuestionCardPopup(cardId, 'commonarea');
			});
		};
		this.playerTribe.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const tribe = data?.type ?? '';
			const isKnight = tribe === 'knight';
			dojo.addClass(cardDiv, isKnight ? 'kk_card_knight' : 'kk_card_knave');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_content kk_identity_content">${isKnight ? '⚔️ Knight' : '🎭 Knave'}</div>`
			);
		};
		this.playerNumber.onItemCreate = (cardDiv: HTMLElement, _type: number, divId: string) => {
			const data = this.cardDataById[extractCardId(divId)];
			const num = data?.type_arg ?? '';
			dojo.addClass(cardDiv, 'kk_card_number');
			cardDiv.insertAdjacentHTML('beforeend',
				`<div class="kk_card_content kk_number_content">${num}</div>`
			);
		};

		// Load secret card targets and current question state
		this.secretCardTargets = (gamedatas as any).secretCardTargets ?? {};
		const lastPlayedCard = (gamedatas as any).lastPlayedCard;
		if (lastPlayedCard) {
			this.currentQuestionCardId = String(lastPlayedCard);
			this.currentQuestionTargetId = String((gamedatas as any).lastPlayedTarget || '');
			// Find the asker from commonarea (location_arg = player_id who played it)
			const playedCardData = (gamedatas as any).commonarea?.[lastPlayedCard];
			if (playedCardData) {
				this.currentQuestionAskerId = String(playedCardData.location_arg);
			}
		}

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
			this.playedQuestionAskers[card.id] = String(card.location_arg);
			this.commonArea.addToStockWithId(0, card.id);
			// For secret cards, hide question from non-participants
			if (parseInt(card.type) === 3) {
				const askerPlayerId = String(card.location_arg);
				const targetPlayerId = String(this.secretCardTargets[card.id] ?? '');
				const isParticipant = askerPlayerId === String(this.player_id) || targetPlayerId === String(this.player_id);
				if (!isParticipant) {
					const el = $('commonarea_item_' + card.id);
					if (el) dojo.addClass(el, 'kk_secret_hidden');
				}
			}
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

		// Show identities that were already revealed before this client connected (e.g. on reload)
		const revealedIdentities = (gamedatas as any).revealedIdentities as Record<string, { tribe: string; number: number }>;
		for (const player_id in revealedIdentities) {
			const identity = revealedIdentities[player_id]!;
			this.renderRevealedIdentity(player_id, identity.tribe, identity.number);
		}

		// Restore answer chips on commonarea cards from gamedatas
		if (this.gamedatas!['answers']) {
			for (const ans of this.gamedatas!['answers'] as any[]) {
				this.displayAnswerChip(ans.card_id, ans.player_id, ans.answer);
			}
		}

		const pendingGuess = (gamedatas as any).pendingGuess;
		if (pendingGuess) {
			this.pendingGuess = { tribe: pendingGuess.tribe, number: parseInt(pendingGuess.number) };
		}

		// Create card selection preview overlay (shown when selecting a card to play)
		dojo.place(`
			<div id="kk_card_preview_overlay" class="kk_overlay kk_overlay_clickable" style="display:none">
				<div id="kk_card_preview" class="kk_card_preview">
					<div class="kk_card_preview_inner">
						<div id="kk_preview_card" class="kk_preview_card"></div>
						<div id="kk_preview_hint" class="kk_preview_hint"></div>
						<div id="kk_preview_actions_title" class="kk_preview_actions_title"></div>
						<div id="kk_preview_actions" class="kk_preview_actions"></div>
					</div>
				</div>
			</div>
		`, document.body);

		// Clicking outside the card preview dismisses it
		dojo.connect($('kk_card_preview_overlay')!, 'onclick', (e: MouseEvent) => {
			if ((e.target as HTMLElement).id === 'kk_card_preview_overlay') {
				this.dismissCardPreview();
			}
		});

		// Results popup for when all guesses about one target are revealed at once
		dojo.place(`
			<div id="kk_guess_results_overlay" class="kk_overlay kk_overlay_clickable" style="display:none">
				<div id="kk_guess_results" class="kk_card_preview kk_guess_results"></div>
			</div>
		`, document.body);
		dojo.connect($('kk_guess_results_overlay')!, 'onclick', (e: MouseEvent) => {
			if ((e.target as HTMLElement).id === 'kk_guess_results_overlay') {
				this.hideGuessResults();
			}
		});

		// Wire up selection handler
		dojo.connect( this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged' );

		// Safety net: re-fit every card's text once the page has fully settled, in case
		// any individual card was measured before its box had finished laying out.
		requestAnimationFrame(() => requestAnimationFrame(() => {
			document.querySelectorAll('#myhand .kk_card_content, #commonarea .kk_card_content').forEach((el) => {
				this.fitCardText(el as HTMLElement);
			});
		}));

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
			this.hideCurrentQuestion();
			break;
		case 'targetResponse':
			// Restore currentQuestionCardId from gamedatas if not set (page reload mid-response)
			if (!this.currentQuestionCardId) {
				const lastCard = (this.gamedatas as any).lastPlayedCard;
				if (lastCard) {
					this.currentQuestionCardId = String(lastCard);
					this.currentQuestionTargetId = String((this.gamedatas as any).lastPlayedTarget || '');
				}
			}
			this.updateCurrentQuestionDisplay();
			break;
		case 'playerTurnGuess':
			this.hideCurrentQuestion();
			break;
		}
	}

	override onLeavingState(stateName: BGA.ActiveGameState["name"]): void
	{
		console.log( 'Leaving state: ' + stateName );
		if (stateName === 'targetResponse') {
			this.hideCurrentQuestion();
		}
	}

	override onUpdateActionButtons(...[stateName, args]: BGA.GameStateTuple<['name', 'args']>): void
	{
		console.log( 'onUpdateActionButtons: ' + stateName, args );

		// The status bar is reset to the state description whenever the set of
		// active players changes (e.g. someone answers an ask-all), so put the
		// question banner back for everyone, not just the players still answering.
		if (stateName === 'targetResponse') {
			this.showQuestionBanner();
		}
		if (stateName === 'joinGuess') {
			this.joinGuessArgs = args;
			this.showJoinGuessStatus();
		}

		if(!this.isCurrentPlayerActive())
			return;

		switch( stateName )
		{
			case 'playerTurnAsk':
				this.removeActionButtons();
				this.promptAskOptions();
				break;
			case 'targetResponse':
				this.removeActionButtons();
				this.promptResponse();
				break;
			case 'playerTurnGuess':
				this.removeActionButtons();
				this.promptGuessOrEndTurn();
				break;
			case 'joinGuess':
				this.removeActionButtons();
				this.promptJoinGuess();
				break;
		}
	}

	///////////////////////////////////////////////////
	//// Utility methods
	///////////////////////////////////////////////////

	renderPlayerNotesPanel() {
		const renderScratchRow = (label: string) => {
			const cells = Array.from({ length: 10 }, (_, index) =>
				`<td onclick="toggleScratch(this)">${index + 1}</td>`
			).join('');
			return `<tr><th>${label}</th>${cells}</tr>`;
		};

		return `
			<details class="kk_player_notes">
				<summary class="kk_player_notes_summary">Notes</summary>
				<div class="kk_player_notes_body">
					<table class="number-table kk_player_notes_table">
						${renderScratchRow('knight')}
						${renderScratchRow('knave')}
					</table>
				</div>
			</details>
		`;
	}

	changeMainBar(message: string) {
		$("pagemaintitletext")!.innerHTML = message;
	}

	// Shrinks a card's text to fit within its fixed-size text region (instead of
	// overflowing it), since question length and font rendering vary by browser/OS.
	fitCardText(el: HTMLElement | null) {
		if (!el) return;
		let baseFontSize = parseFloat(el.dataset['baseFontSize'] ?? '');
		if (!baseFontSize) {
			baseFontSize = parseFloat(getComputedStyle(el).fontSize);
			el.dataset['baseFontSize'] = String(baseFontSize);
		}
		const minFontSize = 6;
		let fontSize = baseFontSize;
		el.style.fontSize = fontSize + 'px';
		while (fontSize > minFontSize && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
			fontSize -= 0.5;
			el.style.fontSize = fontSize + 'px';
		}
	}

	// Some card regions (hand cards on initial load, the preview popup right as it
	// opens) can be measured before the browser has finished laying them out, which
	// would make fitCardText see a 0-size box and skip shrinking. Defer past that by
	// waiting a couple of animation frames before measuring.
	fitCardTextDeferred(el: HTMLElement | null) {
		if (!el) return;
		requestAnimationFrame(() => requestAnimationFrame(() => this.fitCardText(el)));
	}

	getCardSpritePos(cardType: number, qIndex: number): number {
		return (cardType - 1) * imagesPerRow + qIndex;
	}

	getCurrentQuestionDetails() {
		const cardId = this.currentQuestionCardId;
		if (!cardId) return null;
		const data = this.cardDataById[cardId];
		if (!data) return null;
		const questions = (this.gamedatas as any).questions as Record<number, { description: string }>;
		const text = questions[parseInt(data.type_arg)]?.description ?? '';
		if (!text) return null;
		return {
			cardId,
			cardType: parseInt(data.type),
			text
		};
	}

	showQuestionStatusForAsker() {
		const details = this.getCurrentQuestionDetails();
		if (!details || this.currentQuestionAskerId !== String(this.player_id)) return;

		if (details.cardType === 2) {
			this.changeMainBar(`You asked everyone: ${details.text}`);
			return;
		}

		const targetName = this.coloredPlayerName(this.currentQuestionTargetId);
		if (details.cardType === 3) {
			this.changeMainBar(`You asked ${targetName} in secret: ${details.text}`);
			return;
		}
		this.changeMainBar(`You asked ${targetName}: ${details.text}`);
	}

	showQuestionStatusForResponder() {
		const details = this.getCurrentQuestionDetails();
		if (!details || !this.isCurrentPlayerActive()) return;
		const askerName = this.coloredPlayerName(this.currentQuestionAskerId);
		if (details.cardType === 2) {
			this.changeMainBar(`${askerName} asks everyone: ${details.text}`);
			return;
		}
		if (details.cardType === 3) {
			this.changeMainBar(`${askerName} asks you in secret: ${details.text}`);
			return;
		}
		this.changeMainBar(`${askerName} asks you: ${details.text}`);
	}

	// Players who aren't asking or (still) answering see who asked whom, and
	// what — unless it was asked in secret.
	showQuestionStatusForObserver() {
		const cardId = this.currentQuestionCardId;
		if (!cardId || !this.currentQuestionAskerId) return;
		const cardType = parseInt(this.cardDataById[cardId]?.type ?? '1');
		const askerName = this.coloredPlayerName(this.currentQuestionAskerId);
		const targetName = this.coloredPlayerName(this.currentQuestionTargetId);
		if (cardType === 3) {
			this.changeMainBar(`${askerName} asks ${targetName} a question in secret`);
			return;
		}
		const text = this.getQuestionCardText(cardId);
		if (cardType === 2) {
			this.changeMainBar(`${askerName} asks everyone: ${text}`);
			return;
		}
		this.changeMainBar(`${askerName} asks ${targetName}: ${text}`);
	}

	showQuestionBanner() {
		if (this.currentQuestionAskerId === String(this.player_id)) {
			this.showQuestionStatusForAsker();
		} else if (this.isCurrentPlayerActive()) {
			this.showQuestionStatusForResponder();
		} else {
			this.showQuestionStatusForObserver();
		}
	}

	updateCurrentQuestionDisplay() {
		if (this.currentState !== 'targetResponse') return;
		this.showQuestionBanner();
	}

	hideCurrentQuestion() {}

	getQuestionCardText(cardId: string) {
		const data = this.cardDataById[cardId];
		if (!data) return '';
		const questions = (this.gamedatas as any).questions as Record<number, { description: string }>;
		return questions[parseInt(data.type_arg)]?.description ?? (parseInt(data.type_arg) === -1 ? _('Secret question') : '');
	}

	getPlayerDisplayName(playerId: string | null | undefined) {
		if (!playerId) return _('Unknown player');
		return this.gamedatas!.players[playerId as any]?.name ?? _('Unknown player');
	}

	// Player name in bold in their color, the way BGA shows names in the status bar.
	coloredPlayerName(playerId: string | null | undefined) {
		const player = playerId ? this.gamedatas!.players[playerId as any] : null;
		if (!player) return _('another player');
		return `<span style="font-weight:bold;color:#${player.color}">${player.name}</span>`;
	}

	// Turns a gray button into a white one with the player's name in bold in
	// their color, like coloredPlayerName.
	stylePlayerButton(button: HTMLElement | null, playerId: string | number) {
		const hex = this.gamedatas!.players[playerId as any]?.color;
		if (!button || !hex) return;
		button.classList.add('kk_player_button');
		button.style.color = '#' + hex;
	}

	// Darker than the standard gray so it stands apart from player buttons.
	addCancelButton(id: string, method: keyof this | (() => void)) {
		this.addActionButton(id, _('Cancel'), method, undefined, false, 'gray');
		$(id)?.classList.add('kk_cancel_button');
	}

	isQuestionCardPlayable(cardId: string) {
		if (this.currentState !== 'playerTurnAsk' || !this.isCurrentPlayerActive()) return false;
		return this.playerHand.getSelectedItems().some((item: { id: number | string }) => String(item.id) === cardId);
	}

	getCardPreviewHint(cardId: string, source: 'hand' | 'commonarea', mode: 'play' | 'inspect', cardType: number, typeName: string, icon: string) {
		const lines = [`<strong>${icon ? icon + ' ' : ''}${typeName}</strong>`];

		if (source === 'commonarea' || this.playedQuestionAskers[cardId]) {
			lines.push(`${_('Asked by')}: ${this.coloredPlayerName(this.playedQuestionAskers[cardId])}`);
			const responses = [...(this.cardAnswers[cardId] ?? [])].sort((left, right) => left.playerId.localeCompare(right.playerId));
			if (responses.length > 0) {
				for (const response of responses) {
					const answerText = response.answer === 'yes' ? _('Yes') : _('No');
					lines.push(`${this.coloredPlayerName(response.playerId)}: ${answerText}`);
				}
			} else if (cardId === this.currentQuestionCardId && (cardType === 1 || cardType === 3) && this.currentQuestionTargetId) {
				lines.push(`${_('Waiting for response from')}: ${this.coloredPlayerName(this.currentQuestionTargetId)}`);
			} else if (cardId === this.currentQuestionCardId && cardType === 2) {
				lines.push(_('Waiting for responses.'));
			} else {
				lines.push(_('No responses yet.'));
			}
			return lines.join('<br>');
		}

		lines.push(mode === 'play'
			? ((cardType === 1 || cardType === 3) ? _('Select a player to ask') : _('This will ask all players'))
			: _('This card has not been played yet.'));
		return lines.join('<br>');
	}

	getCardAnswerDotsHtml(cardId: string, containerClass = 'kk_chips_container') {
		const answers = this.cardAnswers[cardId] ?? [];
		if (answers.length === 0) return '';

		const renderDots = (answer: 'yes' | 'no') => answers
			.filter(entry => entry.answer === answer)
			.sort((left, right) => left.color.localeCompare(right.color))
			.map(entry => {
				const playerName = this.getPlayerDisplayName(entry.playerId);
				const answerText = answer === 'yes' ? _('Yes') : _('No');
				const chipClass = answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';
				return `<div class="kk_answer_chip ${chipClass}" title="${playerName}: ${answerText}" aria-label="${playerName}: ${answerText}" style="background:${entry.color}"></div>`;
			})
			.join('');

		return `
			<div class="${containerClass}">
				<div class="kk_chips_row kk_chips_row_top">${renderDots('yes')}</div>
				<div class="kk_chips_row kk_chips_row_bottom">${renderDots('no')}</div>
			</div>
		`;
	}

	openQuestionCardPopup(cardId: string, source: 'hand' | 'commonarea') {
		const mode = source === 'hand' && this.isQuestionCardPlayable(cardId) ? 'play' : 'inspect';
		this.showCardPreview(cardId, source, mode);
		if (mode === 'play') {
			this.showAskActions(cardId);
			return;
		}
		this.clearCardPreviewActions();
	}

	showCardPreview(cardId: string, source: 'hand' | 'commonarea' = 'hand', mode: 'play' | 'inspect' = 'inspect') {
		const overlay = $('kk_card_preview_overlay') as HTMLElement | null;
		if (!overlay) return;
		const data = this.cardDataById[cardId];
		if (!data) return;
		const text = this.getQuestionCardText(cardId);
		const cardType = parseInt(data.type);
		// Ask-one is the default card type, so like the cards in hand it gets no icon.
		const typeIcons: Record<number, string> = { 1: '', 2: '👥', 3: '🤫' };
		const typeNames: Record<number, string> = { 1: 'Ask one player', 2: 'Ask all players', 3: 'Ask in secret' };
		const typeClassMap: Record<number, string> = { 1: 'kk_card_ask_one', 2: 'kk_card_ask_all', 3: 'kk_card_ask_secret' };
		const icon = typeIcons[cardType] ?? '';
		const typeName = typeNames[cardType] ?? '';
		this.previewSource = source;
		this.previewMode = mode;

		// Render an enlarged card graphic
		const cardEl = $('kk_preview_card');
		if (cardEl) {
			cardEl.className = `kk_preview_card ${typeClassMap[cardType] ?? 'kk_card_ask_one'}`;
			cardEl.innerHTML =
				`<div class="kk_card_type_icon kk_preview_card_icon" title="${typeName}" aria-label="${typeName}">${icon}</div>` +
				`<div class="kk_card_content kk_preview_card_text">${text}</div>` +
				this.getCardAnswerDotsHtml(cardId, 'kk_chips_container kk_preview_chips_container');
		}

		const hintEl = $('kk_preview_hint');
		if (hintEl) {
			hintEl.innerHTML = this.getCardPreviewHint(cardId, source, mode, cardType, typeName, icon);
		}

		overlay.style.display = 'flex';
		if (cardEl) this.fitCardTextDeferred(cardEl.querySelector('.kk_card_content') as HTMLElement | null);
	}

	hideCardPreview() {
		const overlay = $('kk_card_preview_overlay') as HTMLElement | null;
		if (overlay) overlay.style.display = 'none';
		this.previewSource = null;
		this.previewMode = null;
		this.clearCardPreviewActions();
	}

	dismissCardPreview() {
		const previewSource = this.previewSource;
		const previewMode = this.previewMode;
		this.hideCardPreview();
		if (previewSource === 'hand') {
			this.playerHand.unselectAll();
		}
		if (previewMode === 'play') {
			this.removeActionButtons();
			this.promptAskOptions();
		}
	}

	clearCardPreviewActions() {
		const titleEl = $('kk_preview_actions_title') as HTMLElement | null;
		const actionsEl = $('kk_preview_actions') as HTMLElement | null;
		if (titleEl) titleEl.innerHTML = '';
		if (actionsEl) actionsEl.innerHTML = '';
	}

	getAskTargets() {
		return Object.entries(this.gamedatas!.players)
			.filter(([pid, player]) => pid !== String(this.player_id) && (player as any).revealed != 1)
			.map(([pid, player]) => ({ id: pid, name: player.name }));
	}

	addPreviewActionButton(
		container: HTMLElement,
		label: string,
		handler: () => void,
		colorClass: 'blue' | 'gray' = 'blue'
	): HTMLAnchorElement {
		const button = dojo.create('a', {
			className: `bgabutton bgabutton_${colorClass} kk_preview_action_button`,
			href: '#',
			innerHTML: label
		}, container) as HTMLAnchorElement;
		dojo.connect(button, 'onclick', (evt: MouseEvent) => {
			dojo.stopEvent(evt);
			handler();
		});
		return button;
	}

	renderCardPreviewActions(cardId: string) {
		const titleEl = $('kk_preview_actions_title') as HTMLElement | null;
		const actionsEl = $('kk_preview_actions') as HTMLElement | null;
		if (!titleEl || !actionsEl) return;

		this.clearCardPreviewActions();

		const cardType = parseInt(this.cardDataById[cardId]?.type ?? '1');

		if (cardType === 1 || cardType === 3) {
			titleEl.innerHTML = _('Select a player to ask');
			for (const target of this.getAskTargets()) {
				const button = this.addPreviewActionButton(
					actionsEl,
					target.name,
					() => this.playCardWithTarget(cardId, parseInt(target.id)),
					'gray'
				);
				this.stylePlayerButton(button, target.id);
			}
		} else {
			titleEl.innerHTML = _('Ask everyone this question?');
			this.addPreviewActionButton(
				actionsEl,
				_('Ask all'),
				() => this.playCardWithTarget(cardId, 0)
			);
		}

		this.addPreviewActionButton(actionsEl, _('Cancel'), () => this.playCardCancel(), 'gray')
			.classList.add('kk_cancel_button');
	}

	showAskActions(cardId: string) {
		const cardType = parseInt(this.cardDataById[cardId]?.type ?? '1');

		this.removeActionButtons();
		this.renderCardPreviewActions(cardId);

		if (cardType === 1 || cardType === 3) {
			for (const target of this.getAskTargets()) {
				this.addActionButton(
					`target_button_${target.id}`,
					_(target.name),
					() => this.playCardWithTarget(cardId, parseInt(target.id)),
					undefined,
					false,
					'gray'
				);
				this.stylePlayerButton($(`target_button_${target.id}`), target.id);
			}
		} else {
			this.addActionButton('playCard_button', _('Ask all'), () => this.playCardWithTarget(cardId, 0));
		}
		this.addCancelButton('cancel_button', 'playCardCancel');
	}

	displayAnswerChip(cardId: number | string, playerId: number | string, answer: string) {
		const cardDiv = $('commonarea_item_' + cardId);
		if (!cardDiv) return;
		const playerInfo = this.gamedatas!.players[playerId as any];
		if (!playerInfo) return;

		const color = '#' + playerInfo.color;
		const key = String(cardId);
		if (!this.cardAnswers[key]) this.cardAnswers[key] = [];

		// Avoid duplicates
		if (this.cardAnswers[key].some(a => a.playerId === String(playerId))) return;
		this.cardAnswers[key].push({ playerId: String(playerId), answer, color });

		// Remove old chips container
		const oldContainer = cardDiv.querySelector('.kk_chips_container');
		if (oldContainer) oldContainer.remove();

		// Keep chip order stable within each answer row.
		const sortByColor = (a: { color: string }, b: { color: string }) => {
			return a.color.localeCompare(b.color);
		};
		const yesAnswers = this.cardAnswers[key].filter(a => a.answer === 'yes').sort(sortByColor);
		const noAnswers = this.cardAnswers[key].filter(a => a.answer === 'no').sort(sortByColor);

		const chipHtml = (a: { playerId: string; answer: string; color: string }) => {
			const p = this.gamedatas!.players[a.playerId as any];
			const cls = a.answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';
			const answerText = a.answer === 'yes' ? 'Yes' : 'No';
			return `<div class="kk_answer_chip ${cls}" title="${p?.name ?? ''}: ${answerText}" aria-label="${p?.name ?? ''}: ${answerText}" style="background:${a.color}"></div>`;
		};

		cardDiv.insertAdjacentHTML('beforeend',
			`<div class="kk_chips_container">` +
				`<div class="kk_chips_row kk_chips_row_top">${yesAnswers.map(chipHtml).join('')}</div>` +
				`<div class="kk_chips_row kk_chips_row_bottom">${noAnswers.map(chipHtml).join('')}</div>` +
			`</div>`
		);
	}

	///////////////////////////////////////////////////
	//// Player actions
	///////////////////////////////////////////////////

	onPlayerHandSelectionChanged( evt: Event )
	{
		const canPlaySelectedCard = this.currentState === 'playerTurnAsk' && this.isCurrentPlayerActive();
		const selection = this.playerHand.getSelectedItems();
		if (selection.length === 0) {
			// Deselected — reset buttons if needed
			this.hideCardPreview();
			if (canPlaySelectedCard) {
				this.removeActionButtons();
				this.promptAskOptions();
			}
			return;
		}

		const item = selection[0];
		this.openQuestionCardPopup(String(item.id), 'hand');
	}

	playCardWithTarget( cardId: number | string, targetId: number ) {
		const numericCardId = parseInt(String(cardId));
		this.currentQuestionCardId = String(numericCardId);
		this.currentQuestionTargetId = String(targetId);
		this.currentQuestionAskerId = String(this.player_id);
		this.hideCardPreview();
		this.removeActionButtons();
		this.showQuestionStatusForAsker();
		this.bgaPerformAction( 'actPlayCard', { card_id: numericCardId, target_id: targetId } );
		this.playerHand.removeFromStockById(numericCardId);
	}

	playCardCancel( evt?: Event ) {
		this.dismissCardPreview();
	}

	onDiscardAndRedraw( evt: Event ) {
		// Redrawing costs the player their question for the turn, so make sure
		// they meant to click it.
		this.confirmationDialog(
			_('Discard your whole hand and draw 5 new question cards? You will not ask a question this turn, but you may still make a guess.'),
			() => this.bgaPerformAction( 'actDiscardAndRedraw', {} )
		);
	}

	promptResponse() {
		const questions = (this.gamedatas as any).questions as Record<number, { description: string; code: string }>;
		const idtribe = this.gamedatas!['idtribe'] as any;
		const idnumber = this.gamedatas!['idnumber'] as any;
		const tribeCard = Object.values(idtribe ?? {})[0] as any;
		const numberCard = Object.values(idnumber ?? {})[0] as any;

		let expectedAnswer: string | null = null;

		if (tribeCard && numberCard && this.currentQuestionCardId) {
			const cardData = this.cardDataById[this.currentQuestionCardId];
			if (cardData) {
				const typeArg = parseInt(cardData.type_arg);
				const question = questions[typeArg];
				if (question?.code) {
					const number = parseInt(numberCard.type_arg); // 1–10
					const tribe = tribeCard.type as string; // 'knight' or 'knave'
					// code[10 - N] = '1' → yes is correct for number N
					const truthIsYes = question.code[10 - number] === '1';
					expectedAnswer = (tribe === 'knight') ? (truthIsYes ? 'yes' : 'no') : (truthIsYes ? 'no' : 'yes');
				}
			}
		}

		const tribe = tribeCard?.type ?? 'knight';
		const wrongHandler = () => {
			this.showMessage(_(`That's not correct! As a ${tribe}, you must answer ${expectedAnswer}.`), 'error');
		};

		if (expectedAnswer === 'yes') {
			this.addActionButton('yes_button', _('Yes'), 'yesResponse');
			this.addActionButton('no_button', _('No'), wrongHandler, undefined, false, 'red');
		} else if (expectedAnswer === 'no') {
			this.addActionButton('yes_button', _('Yes'), wrongHandler, undefined, false, 'red');
			this.addActionButton('no_button', _('No'), 'noResponse');
		} else {
			// Fallback: both enabled (server validates)
			this.addActionButton('yes_button', _('Yes'), 'yesResponse');
			this.addActionButton('no_button', _('No'), 'noResponse');
		}
	}

	yesResponse( evt?: Event ) {
		this.bgaPerformAction( 'actGiveAnswer', { response: 'yes' } );
	}

	noResponse( evt?: Event ) {
		this.bgaPerformAction( 'actGiveAnswer', { response: 'no' } );
	}

	promptAskOptions() {
		this.addActionButton( 'discard_button', _('Draw new hand'), 'onDiscardAndRedraw', undefined, false, 'gray' );
	}

	promptGuessOrEndTurn() {
		this.addActionButton( 'guess_button', _('Guess'), 'playGuessTarget' );
		this.addActionButton( 'pass_button', _('End turn'), 'playerPass', undefined, false, 'gray' );
	}

	// Backing out of the guess flow returns to the top of the guess phase, main
	// bar included — playGuessTarget and friends overwrite it as they go.
	cancelGuess() {
		this.removeActionButtons();
		this.changeMainBar(_('You may make a guess or end your turn'));
		this.promptGuessOrEndTurn();
	}

	// "Everyone may join a guess" option: the target is already chosen, so
	// joining goes straight to picking a tribe.
	promptJoinGuess() {
		const args = this.joinGuessArgs;
		if (!args) return;
		const targetId = String(args.target_id);
		this.changeMainBar(`${this.coloredPlayerName(String(args.guesser_id))} is guessing ${this.coloredPlayerName(targetId)}'s identity. Guess too? (1 point if right, an X if wrong)`);
		this.addActionButton( 'join_guess_button', _('Guess too'), () => this.playGuessTribe(targetId) );
		this.addActionButton( 'decline_guess_button', _("Don't guess"), () => this.bgaPerformAction( 'actDeclineGuess', {} ), undefined, false, 'gray' );
	}

	// Status bar for everyone not (or no longer) deciding whether to join a guess.
	showJoinGuessStatus() {
		const args = this.joinGuessArgs;
		if (!args || this.isCurrentPlayerActive()) return;
		const me = String(this.player_id);
		const target = this.coloredPlayerName(String(args.target_id));
		if (String(args.target_id) === me) {
			this.changeMainBar(`${this.coloredPlayerName(String(args.guesser_id))} is guessing your identity, and the other players may guess it too`);
		} else if (this.pendingGuess) {
			this.changeMainBar(`You guessed that ${target} is a ${this.pendingGuess.tribe} with number ${this.pendingGuess.number}. Waiting for the other players to decide whether to guess too…`);
		} else if (String(args.guesser_id) !== me && this.gamedatas!.players[me as any]) {
			this.changeMainBar(`You chose not to guess ${target}'s identity. Waiting for the other players to decide…`);
		}
	}

	// Back to the start of the guess flow: choosing whose identity to guess or,
	// when joining another player's guess (whose target is fixed), the join prompt.
	restartGuess() {
		if (this.currentState === 'joinGuess') {
			this.removeActionButtons();
			this.promptJoinGuess();
		} else {
			this.playGuessTarget();
		}
	}

	playGuessTarget( evt?: Event ) {
		this.removeActionButtons();
		this.changeMainBar(_("Whose identity do you want to guess?"));
		for (const player_id in this.gamedatas!.players) {
			if (player_id == String(this.player_id)) continue;
			const playerInfo = this.gamedatas!.players[player_id as any]!;
			if ((playerInfo as any).revealed == 1) continue;
			this.addActionButton(
				`guess_button_${player_id}`,
				_(playerInfo.name),
				() => this.playGuessTribe(player_id),
				undefined,
				false,
				'gray'
			);
			this.stylePlayerButton($(`guess_button_${player_id}`), player_id);
		}
		this.addCancelButton('cancel_guess', 'cancelGuess');
	}

	playGuessTribe( playerId: string ) {
		this.removeActionButtons();
		this.changeMainBar(`Is ${this.coloredPlayerName(playerId)} a Knight or a Knave?`);
		this.addActionButton( 'guess_button_knight', _('Knight'), () => this.playGuessNumber(playerId, 'knight') );
		this.addActionButton( 'guess_button_knave', _('Knave'), () => this.playGuessNumber(playerId, 'knave') );
		this.addCancelButton('cancel_guess', () => this.restartGuess());
	}

	playGuessNumber( playerId: string, tribe: string ) {
		this.removeActionButtons();
		this.changeMainBar(`What is ${this.coloredPlayerName(playerId)}'s number?`);
		for (let num = 1; num <= 10; num++) {
			const numCopy = num;
			this.addActionButton( `guess_button_${num}`, _(numCopy.toString()), () => this.finalizeGuess(playerId, tribe, numCopy) );
		}
		this.addCancelButton('cancel_guess', () => this.playGuessTribe(playerId));
	}

	finalizeGuess( playerId: string, tribe: string, num: number ) {
		this.removeActionButtons();
		const othersMayJoin = this.currentState === 'playerTurnGuess' && (this.gamedatas as any).everyoneMayJoinGuesses;
		this.changeMainBar(`Guess: ${this.coloredPlayerName(playerId)} is a ${tribe} with number ${num}` +
			(othersMayJoin ? ' (it stays secret while everyone else may guess too)' : ''));
		this.addActionButton( 'confirm_button', _('Confirm Guess'), () => this.confirmGuess(playerId, tribe, num) );
		this.addCancelButton('cancel_button', () => this.restartGuess());
	}

	confirmGuess( playerId: string, tribe: string, num: number ) {
		const joining = this.currentState === 'joinGuess';
		// With the "everyone may join a guess" option, guesses stay secret until
		// they're all revealed, so remember ours to show while we wait.
		if (joining || (this.gamedatas as any).everyoneMayJoinGuesses) {
			this.pendingGuess = { tribe, number: num };
		}
		const request = joining
			? this.bgaPerformAction( 'actJoinGuess', { tribe: tribe, number: num } )
			: this.bgaPerformAction( 'actGuess', { target_id: playerId, tribe: tribe, number: num } );
		Promise.resolve(request).catch(() => { this.pendingGuess = null; });
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
		dojo.subscribe( 'guessesRevealed', this, "ntf_guessesRevealed" );
		dojo.subscribe( 'newScores', this, "ntf_newScores" );
		dojo.subscribe( 'cardsDrawn', this, "ntf_cardsDrawn" );
		dojo.subscribe( 'newHand', this, "ntf_newHand" );
		dojo.subscribe( 'actDiscardAndRedraw', this, "ntf_discardAndRedraw" );
		dojo.subscribe( 'secretQuestion', this, "ntf_secretQuestion" );
	}

	ntf_actCardPlayed( notif: any )
	{
		console.log( 'ntf_actCardPlayed', notif );
		const cardId = String(notif.args.card_id);
		const cardType = parseInt(notif.args.card_type);
		const isAsker = String(notif.args.player_id) === String(this.player_id);

		// For secret cards, the asker already has the correct type_arg from their hand.
		// Non-participants receive card_type_arg = -1 from the server, so we only update
		// cardDataById for non-askers (target gets the real data via ntf_secretQuestion).
		if (!isAsker || cardType !== 3) {
			this.cardDataById[cardId] = { type: notif.args.card_type, type_arg: notif.args.card_type_arg };
		}
		this.playedQuestionAskers[cardId] = String(notif.args.player_id);
		this.currentQuestionCardId = cardId;
		this.currentQuestionTargetId = notif.args.target_id ? String(notif.args.target_id) : null;
		this.currentQuestionAskerId = String(notif.args.player_id);

		// Track secret card target
		if (cardType === 3 && notif.args.target_id) {
			this.secretCardTargets[cardId] = parseInt(notif.args.target_id);
		}

		this.commonArea.addToStockWithId(0, notif.args.card_id);

		// For secret cards, hide question from non-participants
		if (cardType === 3) {
			const isAsker = String(notif.args.player_id) === String(this.player_id);
			const isTarget = String(notif.args.target_id) === String(this.player_id);
			if (!isAsker && !isTarget) {
				const cardEl = $('commonarea_item_' + cardId);
				if (cardEl) dojo.addClass(cardEl, 'kk_secret_hidden');
			}
		}

		this.playerHand.removeFromStockById(notif.args.card_id);
		this.hideCardPreview();

		if (this.currentState === 'targetResponse') {
			this.updateCurrentQuestionDisplay();
		}
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
		const isCorrect = notif.type === 'guessCorrect';
		const tribe = notif.args.tribe;
		const num = notif.args.number;

		if (isCorrect) {
			this.showMessage(
				`🎉 ${notif.args.player_name} correctly guessed! ${notif.args.target_name} is a ${tribe} with number ${num} and their identity is revealed!`,
				'info'
			);
			if (this.gamedatas!.players[notif.args.target_id]) {
				(this.gamedatas!.players[notif.args.target_id] as any).revealed = 1;
			}
			this.renderRevealedIdentity(notif.args.target_id, tribe, num);
		} else {
			this.showMessage(
				`😓 ${notif.args.player_name} guessed wrong! ${notif.args.target_name} is NOT a ${tribe} with number ${num}.`,
				'error'
			);
			const wrongCountDiv = $('wrong_count_' + notif.args.player_id);
			if (wrongCountDiv) wrongCountDiv.textContent = notif.args.wrong_guesses;
		}
	}

	// "Everyone may join a guess" option: every guess about the target is
	// revealed at once, along with the target's identity if anyone was right.
	ntf_guessesRevealed( notif: any )
	{
		console.log( 'ntf_guessesRevealed', notif );
		const args = notif.args;
		this.pendingGuess = null;
		for (const result of args.results) {
			const wrongCountDiv = $('wrong_count_' + result.player_id);
			if (wrongCountDiv) wrongCountDiv.textContent = result.wrong_guesses;
		}
		if (args.tribe) {
			const target = this.gamedatas!.players[args.target_id];
			if (target) (target as any).revealed = 1;
			this.renderRevealedIdentity(args.target_id, args.tribe, args.number);
		}
		this.showGuessResults(args);
	}

	showGuessResults( args: any )
	{
		const overlay = $('kk_guess_results_overlay') as HTMLElement | null;
		const panel = $('kk_guess_results') as HTMLElement | null;
		if (!overlay || !panel) return;

		const target = this.coloredPlayerName(String(args.target_id));
		const tribeLabel = (tribe: string) => tribe === 'knight' ? `⚔️ ${_('Knight')}` : `🎭 ${_('Knave')}`;
		const rows = (args.results as any[]).map(result => `
			<tr class="${result.correct ? 'kk_guess_correct' : 'kk_guess_wrong'}">
				<td>${this.coloredPlayerName(String(result.player_id))}</td>
				<td>${tribeLabel(result.tribe)} ${result.number}</td>
				<td>${result.correct ? `🏆 +${result.points}` : '❌ +1'}</td>
			</tr>`);
		for (const playerId of args.declined as number[]) {
			rows.push(`
			<tr class="kk_guess_declined">
				<td>${this.coloredPlayerName(String(playerId))}</td>
				<td colspan="2">${_('Did not guess')}</td>
			</tr>`);
		}
		const outcome = args.tribe
			? `${target} is a ${tribeLabel(args.tribe)} with number ${args.number}`
			: `Nobody guessed correctly, so ${target}'s identity stays secret`;

		panel.innerHTML = `
			<div class="kk_guess_results_title">Guesses about ${target}</div>
			<table class="kk_guess_results_table">${rows.join('')}</table>
			<div class="kk_guess_results_outcome">${outcome}</div>
		`;
		this.addPreviewActionButton(panel, _('OK'), () => this.hideGuessResults());
		overlay.style.display = 'flex';
	}

	hideGuessResults()
	{
		const overlay = $('kk_guess_results_overlay') as HTMLElement | null;
		if (overlay) overlay.style.display = 'none';
	}

	renderRevealedIdentity( playerId: string | number, tribe: string, number: number )
	{
		if ($('kk_revealed_identity_' + playerId)) return; // already rendered
		const playerBoardDiv = $('player_board_' + playerId);
		if (!playerBoardDiv) return;
		const tribeClass = tribe === 'knight' ? 'kk_revealed_card_knight' : 'kk_revealed_card_knave';
		const tribeIcon = tribe === 'knight' ? '⚔️' : '🎭';
		const tribeLabel = tribe === 'knight' ? _('Knight') : _('Knave');
		dojo.place(
			`<div id="kk_revealed_identity_${playerId}" class="kk_player_info kk_revealed_identity">
				<div class="kk_revealed_card ${tribeClass}" title="${tribeLabel}" aria-label="${tribeLabel}">${tribeIcon}</div>
				<div class="kk_revealed_card kk_revealed_card_number">${number}</div>
			</div>`,
			playerBoardDiv
		);

		// The revealed player's own identity cards are public now — they no
		// longer belong in their private hand display.
		if (String(playerId) === String(this.player_id)) {
			this.playerTribe.removeAll();
			this.playerNumber.removeAll();
		}
	}

	ntf_newScores( notif: any )
	{
		console.log( 'ntf_newScores', notif );
		for (const pid in notif.args.newScores) {
			(this.scoreCtrl as any)[pid]?.toValue(notif.args.newScores[pid]);
			const trophyDiv = $('trophy_count_' + pid);
			if (trophyDiv) trophyDiv.textContent = notif.args.newScores[pid];
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

	ntf_secretQuestion( notif: any )
	{
		console.log( 'ntf_secretQuestion', notif );
		const cardId = String(notif.args.card_id);
		const questions = (this.gamedatas as any).questions as Record<number, { description: string }>;
		const text = questions[parseInt(notif.args.card_type_arg)]?.description ?? '';

		// Update card data with actual question
		if (this.cardDataById[cardId]) {
			this.cardDataById[cardId].type_arg = String(notif.args.card_type_arg);
		}
		this.currentQuestionCardId = cardId;

		// Reveal the question on the card
		const cardEl = $('commonarea_item_' + cardId);
		if (cardEl) {
			dojo.removeClass(cardEl, 'kk_secret_hidden');
			const contentEl = cardEl.querySelector('.kk_card_content') as HTMLElement | null;
			if (contentEl) {
				contentEl.innerHTML = text;
				this.fitCardTextDeferred(contentEl);
			}
		}

		this.updateCurrentQuestionDisplay();
	}
}

window.bgagame = { knightsandknaves: KnightsAndKnaves };
