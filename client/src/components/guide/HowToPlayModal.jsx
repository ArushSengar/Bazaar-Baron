import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Check,
  Ban,
  ArrowRight
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { GAME_GUIDES, getGuideForGame } from '../../data/guides.js';

// Normalized Game Tab Definitions
const GAME_TABS = [
  { id: 'monopoly', label: 'Bazaar Baron', icon: '🕌', badge: 'Trading', color: 'from-amber-500 to-amber-700' },
  { id: 'uno', label: 'Bazaar UNO', icon: '🃏', badge: 'Cards', color: 'from-red-500 to-amber-500' },
  { id: 'ludo', label: 'Bazaar Ludo', icon: '🎲', badge: 'Strategy', color: 'from-emerald-500 to-teal-600' },
  { id: 'snakes_and_ladders', label: 'Snakes & Ladders', icon: '🐍', badge: 'Classic', color: 'from-purple-500 to-indigo-600' },
];

function normalizeGameId(id) {
  if (!id) return 'monopoly';
  const clean = String(id).toLowerCase().trim().replace(/[-\s]/g, '_');
  if (clean === 'bazaar_baron' || clean === 'baron') return 'monopoly';
  if (clean === 'bazaar_uno') return 'uno';
  if (clean === 'bazaar_ludo') return 'ludo';
  if (clean === 'snakes' || clean === 'snakes_ladders' || clean === 'snakesandladders') return 'snakes_and_ladders';
  return clean;
}

// Built-in fallback guide definitions for resilient standalone rendering
const FALLBACK_GUIDES = {
  monopoly: {
    gameId: 'monopoly',
    title: 'Bazaar Baron',
    subtitle: 'Indian Tabletop Property Trading & Empire Building',
    icon: '🕌',
    badge: '2-6 Players • 20-45 Mins',
    playerCount: '2-6 Players',
    playTime: '20-45 Mins',
    objective: 'Bankrupt all rival merchants by acquiring property monopolies, constructing havelis, and collecting royal rents.',
    steps: [
      {
        title: 'Roll Dice & Navigate the Bazaar',
        description: 'Roll two 6-sided dice each turn to travel clockwise across iconic Indian bazaars like Chandni Chowk, Marine Drive, and Howrah. Passing GO (Pratham) pays ₹200 salary!',
        highlights: ['Doubles grant an extra roll (3 in a row sends you to Detention)', 'Collect ₹200 every time you pass Pratham', 'Land on unowned properties to buy them or trigger public auctions'],
        visualType: 'dice',
        tip: 'Speed matters early! Snatch unowned properties rapidly to prevent competitors from completing monopolies.'
      },
      {
        title: 'Acquiring Localities & Havelis',
        description: 'Collect all properties in a color set to establish a monopoly. Monopolies double your base rent and unlock the power to build up to 4 Havelis and 1 Royal Haveli (Hotel)!',
        highlights: ['Color monopolies double base rent automatically', 'Build havelis evenly across your set', 'Royal Havelis inflict devastating rent penalties on visiting rivals'],
        visualType: 'board',
        tip: 'Building 3 Havelis gives the steepest rent escalation per rupee spent! Prioritize reaching 3 havelis quickly.'
      },
      {
        title: 'Kismat Decks, Auctions & Trading',
        description: 'Passing on an unowned property sends it to a live public auction where anyone can bid! Draw Kismat cards for unexpected fortunes or penalties, and trade directly with rivals.',
        highlights: ['Public auctions start at ₹10 with real-time bidding', 'Propose cash and property swaps with other merchants', 'Mortgage properties at 50% value to survive debts'],
        visualType: 'special',
        tip: 'Never decline an auction without bidding if the price is low—you can acquire valuable blocking deeds for cheap!'
      }
    ]
  },
  uno: {
    gameId: 'uno',
    title: 'Bazaar UNO',
    subtitle: 'Fast-Paced Color & Number Matching Party Card Game',
    icon: '🃏',
    badge: '2-10 Players • 10-15 Mins',
    playerCount: '2-10 Players',
    playTime: '10-15 Mins',
    objective: 'Be the first merchant to discard all your cards each round. First player to reach 250 points wins the championship!',
    steps: [
      {
        title: 'Matching Cards & Turn Play',
        description: 'On your turn, match the top card of the Discard Pile by Color, Number, or Action Symbol. If you cannot play, you must draw 1 card from the Draw Pile.',
        highlights: ['Match by color (e.g., Red on Red)', 'Match by number (e.g., 7 on 7)', 'Wild cards can be played on any card at any time'],
        visualType: 'cards',
        tip: 'Save your Wild and action cards for critical counter-plays when opponents have small hands.'
      },
      {
        title: 'Action & Wild Cards',
        description: 'Disrupt rival merchants with high-impact action cards: Skip (🚫), Reverse (🔄), Draw Two (+2), Wild, and Wild Draw Four (+4)!',
        highlights: ['Skip passes the next player turn', 'Reverse flips play direction between clockwise and counter-clockwise', '+2 and +4 force victims to draw cards and forfeit their turn'],
        visualType: 'special',
        tip: 'When someone plays a Skip or Reverse on you, take note of their preferred colors to trap them on your next play.'
      },
      {
        title: 'Calling UNO & Catching Rivals',
        description: 'When you play your second-to-last card and have only ONE card remaining, you MUST shout "UNO!". If a rival catches you before the next player takes a turn, you draw 2 penalty cards!',
        highlights: ['Hit the UNO button before your turn ends with 1 card left', 'Catching an opponent who forgot UNO inflicts a 2-card penalty', 'Emptying your hand wins the round and tallies rival card values as points'],
        visualType: 'tokens',
        tip: 'Keep your finger hovering near the CATCH button whenever an opponent holds only 2 cards—catch them the instant they play!'
      }
    ]
  },
  ludo: {
    gameId: 'ludo',
    title: 'Bazaar Ludo',
    subtitle: 'Classic Indian Pachisi Strategy Race',
    icon: '🎲',
    badge: '2-4 Players • 15-30 Mins',
    playerCount: '2-4 Players',
    playTime: '15-30 Mins',
    objective: 'Race all 4 of your colored pawns around the 52-tile track and guide them into your Home Triangle before your opponents!',
    steps: [
      {
        title: 'Exiting Yard & Rolling 6s',
        description: 'All 4 pawns start trapped in your color Yard. You must roll a 6 on the die to liberate a pawn onto your starting star tile. Rolling a 6 also grants an immediate bonus roll!',
        highlights: ['Roll a 6 to bring a pawn out of the Yard', 'Rolling a 6 gives another roll', 'Rolling three 6s in a row forfeits the turn'],
        visualType: 'dice',
        tip: 'Whenever possible, keep at least two pawns active on the track to maximize movement choices each turn.'
      },
      {
        title: 'Captures & Safe Star Tiles',
        description: 'Landing directly on an opponent pawn CAPTURES it, sending it all the way back to their Yard and rewarding you with a free bonus roll! Safe tiles marked with Stars (⭐) prevent capture.',
        highlights: ['Capturing an enemy pawn awards an immediate bonus roll', 'Star tiles (⭐) are safe sanctuaries where pawns cannot be captured', 'Multiple pawns of the same color can stack on a tile'],
        visualType: 'tokens',
        tip: 'Lurk 1-5 tiles behind opponent pawns outside safe stars—any low roll gives you an easy capture!'
      },
      {
        title: 'Home Stretch & Victory',
        description: 'After completing a full circuit around the track, your pawns enter your private color Home Stretch. You must roll the exact number required to reach the Home Triangle 🏆.',
        highlights: ['Only your pawns can enter your Home Stretch', 'Exact dice roll required to land in Home', 'First player to bring all 4 pawns home claims 1st place!'],
        visualType: 'board',
        tip: 'Advance trailing pawns into the Home Stretch as soon as possible to avoid getting trapped on the outer board.'
      }
    ]
  },
  snakes_and_ladders: {
    gameId: 'snakes_and_ladders',
    title: 'Snakes & Ladders',
    subtitle: 'Thrilling 100-Tile Race of Fortune and Peril',
    icon: '🐍',
    badge: '2-6 Players • 10-20 Mins',
    playerCount: '2-6 Players',
    playTime: '10-20 Mins',
    objective: 'Navigate the 10x10 board from tile 1 to tile 100. Climb ladders to soar ahead and dodge treacherous snakes sliding you down!',
    steps: [
      {
        title: 'The 100-Square Zigzag Grid',
        description: 'The board is a 10x10 grid with 100 numbered squares. All pawns start at Square 1 and advance in a serpentine zigzag path.',
        highlights: ['100 Numbered squares on a 10x10 grid', 'Serpentine zigzag progression across rows', 'Race to the summit on Square 100'],
        visualType: 'board',
        tip: 'Remember the zigzag track direction! Every multiple of 10 turns upward and reverses direction.'
      },
      {
        title: 'Rolling the Die & Moving',
        description: 'Take turns rolling a single 6-sided die to advance your pawn across the numbered tiles.',
        highlights: ['Board is numbered 1 to 100 in a serpentine zigzag path', 'Roll 1-6 to advance your pawn forward', 'Bonus roll granted on every 6 rolled'],
        visualType: 'dice',
        tip: 'Snakes and ladders is a game of probability—every turn can flip the standings in seconds!'
      },
      {
        title: 'Ladders Boost, Snakes Slither',
        description: 'Landing exactly on the foot of a Ladder immediately propels your pawn up to the top! But landing on a venomous Snake head sends you sliding down to its tail.',
        highlights: ['Ladders: Instant climb from bottom rung to top', 'Snakes: Slither all the way down from head to tail', 'Neither triggers recursively on landing'],
        visualType: 'special',
        tip: 'Watch out for danger zones near tiles 90-99 where giant snakes await just inches from the finish line!'
      }
    ]
  }
};

/**
 * Visual Renderer: Monopoly Board Deed & Haveli Scale
 */
function BoardVisual() {
  const [havelis, setHavelis] = useState(2);
  const rentScale = [50, 200, 600, 1400, 1700, 2000];

  return (
    <div className="bg-[#FAF7F0] text-[#1B1B1B] border-2 border-amber-600/50 rounded-2xl p-4 shadow-xl select-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* Mini Deed Card */}
        <div className="bg-white border-2 border-[#1B1B1B] rounded-xl overflow-hidden shadow-md">
          <div className="bg-[#2563EB] text-white p-2 text-center border-b-2 border-[#1B1B1B]">
            <span className="text-[9px] uppercase tracking-widest font-black block">TITLE DEED</span>
            <span className="font-display font-black text-sm tracking-tight">MARINE DRIVE</span>
          </div>
          <div className="p-2.5 text-xs space-y-1.5 font-medium">
            <div className="flex justify-between border-b border-neutral-200 pb-1 font-bold">
              <span>List Price</span>
              <span>₹400</span>
            </div>
            <div className={`flex justify-between px-1 py-0.5 rounded transition-colors ${havelis === 0 ? 'bg-amber-100 text-amber-700 font-black' : 'text-neutral-600'}`}>
              <span>Base Rent</span>
              <span>₹50</span>
            </div>
            <div className={`flex justify-between px-1 py-0.5 rounded transition-colors ${havelis === 1 ? 'bg-amber-100 text-amber-700 font-black' : 'text-neutral-600'}`}>
              <span>With 1 Haveli 🏠</span>
              <span>₹200</span>
            </div>
            <div className={`flex justify-between px-1 py-0.5 rounded transition-colors ${havelis === 2 ? 'bg-amber-100 text-amber-700 font-black' : 'text-neutral-600'}`}>
              <span>With 2 Havelis 🏠🏠</span>
              <span>₹600</span>
            </div>
            <div className={`flex justify-between px-1 py-0.5 rounded transition-colors ${havelis === 3 ? 'bg-amber-100 text-amber-700 font-black' : 'text-neutral-600'}`}>
              <span>With 3 Havelis 🏠🏠🏠</span>
              <span>₹1,400</span>
            </div>
            <div className={`flex justify-between px-1 py-0.5 rounded transition-colors ${havelis === 4 ? 'bg-amber-100 text-amber-700 font-black' : 'text-neutral-600'}`}>
              <span>With 4 Havelis 🏠🏠🏠🏠</span>
              <span>₹1,700</span>
            </div>
            <div className={`flex justify-between px-1 py-0.5 rounded transition-colors ${havelis === 5 ? 'bg-amber-200 text-amber-900 font-black ring-1 ring-amber-400' : 'text-neutral-600'}`}>
              <span>With Royal Haveli 🏨</span>
              <span>₹2,000</span>
            </div>
          </div>
        </div>

        {/* Interactive Haveli Demo */}
        <div className="space-y-3">
          <div className="bg-[#F3EBD8] border border-neutral-300 rounded-xl p-3 shadow-inner text-center">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Current Visiting Rent</span>
            <span className="font-number font-black text-2xl text-emerald-700">₹{rentScale[havelis]}</span>
            <div className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-neutral-800">
              {havelis === 5 ? '🏨 Royal Haveli (Hotel)' : havelis === 0 ? 'No Havelis Built' : '🏠'.repeat(havelis)}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => { sounds.playClick?.(); setHavelis(h => Math.max(0, h - 1)); }}
              disabled={havelis === 0}
              className="px-3 py-1 bg-neutral-200 hover:bg-neutral-300 disabled:opacity-40 rounded-lg text-xs font-bold border border-neutral-400 cursor-pointer active:scale-95 transition-all"
            >
              - Sell
            </button>
            <span className="text-xs font-bold text-neutral-700 min-w-[70px] text-center">
              Level: {havelis === 5 ? 'Hotel' : `${havelis}/4`}
            </span>
            <button
              onClick={() => { sounds.playClick?.(); setHavelis(h => Math.min(5, h + 1)); }}
              disabled={havelis === 5}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 rounded-lg text-xs font-bold border border-amber-600 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              + Build Haveli
            </button>
          </div>
          <p className="text-[10px] text-neutral-500 text-center italic">
            Click +/- to test how haveli construction skyrockets rent!
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual Renderer: UNO Mini Cards Showcase
 */
function CardsVisual() {
  const [activeCardDemo, setActiveCardDemo] = useState('Click any card in the sample hand below to test playability!');

  return (
    <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 shadow-xl select-none">
      <div className="text-center mb-3">
        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block mb-1">
          Top Discard Pile Card
        </span>
        <div className="inline-block relative">
          <div className="w-16 h-24 bg-[#0066CC] border-2 border-white rounded-xl shadow-xl flex flex-col justify-between p-1.5 text-white">
            <span className="font-display font-black text-xs leading-none">7</span>
            <span className="font-display font-black text-2xl self-center leading-none">7</span>
            <span className="font-display font-black text-xs self-end leading-none transform rotate-180">7</span>
          </div>
          <div className="text-[10px] font-bold text-neutral-400 mt-1">Target to Match: Blue 7</div>
        </div>
      </div>

      {/* Hand Demo */}
      <div className="border-t border-neutral-800 pt-3">
        <div className="text-[10px] uppercase font-bold text-neutral-400 text-center mb-2">
          Your Sample Hand (Click a card to test playability):
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {/* Card 1: Color Match */}
          <button
            onClick={() => { sounds.playClick?.(); setActiveCardDemo('✓ Blue 3 played! Legal move because colors match (Blue on Blue).'); }}
            className="w-13 h-20 sm:w-15 sm:h-22 bg-[#0066CC] border-2 border-cyan-300 rounded-xl shadow-lg flex flex-col justify-between p-1 text-white hover:scale-105 ring-2 ring-cyan-400/60 cursor-pointer transition-transform"
          >
            <span className="font-display font-black text-[10px] leading-none">3</span>
            <span className="font-display font-black text-xl self-center leading-none">3</span>
            <span className="text-[8px] bg-black/40 rounded px-1 self-center">Color</span>
          </button>

          {/* Card 2: Number Match */}
          <button
            onClick={() => { sounds.playClick?.(); setActiveCardDemo('✓ Red 7 played! Legal move because numbers match (7 on 7).'); }}
            className="w-13 h-20 sm:w-15 sm:h-22 bg-[#EA3223] border-2 border-red-300 rounded-xl shadow-lg flex flex-col justify-between p-1 text-white hover:scale-105 ring-2 ring-red-400/60 cursor-pointer transition-transform"
          >
            <span className="font-display font-black text-[10px] leading-none">7</span>
            <span className="font-display font-black text-xl self-center leading-none">7</span>
            <span className="text-[8px] bg-black/40 rounded px-1 self-center">Number</span>
          </button>

          {/* Card 3: Unplayable */}
          <button
            onClick={() => { sounds.playClick?.(); setActiveCardDemo('✗ Green Skip cannot be played! Neither the color (Green ≠ Blue) nor symbol matches.'); }}
            className="w-13 h-20 sm:w-15 sm:h-22 bg-[#2DA843] opacity-40 border border-neutral-600 rounded-xl flex flex-col justify-between p-1 text-white cursor-not-allowed hover:opacity-60 transition-opacity"
          >
            <Ban className="w-3 h-3" />
            <Ban className="w-6 h-6 self-center" />
            <span className="text-[7px] text-red-300 bg-black/60 rounded px-0.5 self-center">Wrong</span>
          </button>

          {/* Card 4: Wild +4 */}
          <button
            onClick={() => { sounds.playClick?.(); setActiveCardDemo('★ Wild Draw Four played! Wild cards can be played anytime, changing color and forcing +4 cards.'); }}
            className="w-13 h-20 sm:w-15 sm:h-22 bg-neutral-900 border-2 border-amber-300 rounded-xl shadow-lg flex flex-col justify-between p-1 text-white hover:scale-105 ring-2 ring-amber-400 cursor-pointer transition-transform"
          >
            <span className="font-display font-black text-[10px] text-amber-300 leading-none">+4</span>
            <div className="w-5 h-5 rounded-full border border-white grid grid-cols-2 overflow-hidden self-center shadow">
              <div className="bg-[#EA3223]" /><div className="bg-[#0066CC]" /><div className="bg-[#FFC800]" /><div className="bg-[#2DA843]" />
            </div>
            <span className="text-[8px] bg-black/60 text-amber-300 rounded px-1 self-center">Wild</span>
          </button>
        </div>

        {activeCardDemo && (
          <div className="mt-2.5 text-center text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg py-1.5 px-2 animate-fade-in">
            {activeCardDemo}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Visual Renderer: 3D Rolling Dice
 */
function DiceVisual() {
  const [dice, setDice] = useState([6, 6]);
  const [rolling, setRolling] = useState(false);

  const PIP_CONFIGS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const rollDice = () => {
    sounds.playDiceRoll?.();
    setRolling(true);
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      setRolling(false);
    }, 600);
  };

  const isDoubles = dice[0] === dice[1];

  return (
    <div className="bg-[#20130d] border border-amber-600/40 rounded-2xl p-4 text-center shadow-inner select-none">
      <div className="flex items-center justify-center gap-4 py-2">
        {dice.map((val, i) => {
          const activePips = new Set(PIP_CONFIGS[val] || [4]);
          const tumble = rolling ? (i === 0 ? 'dice-tumble-1' : 'dice-tumble-2') : 'hover:scale-105';
          return (
            <div
              key={i}
              className={`w-14 h-14 bg-gradient-to-br from-[#FAF7F0] via-[#FFFFFF] to-[#EBE3D0] border-2 border-[#1B1B1B] rounded-xl shadow-lg p-2 transition-transform duration-200 ${tumble}`}
            >
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
                  <div key={idx} className="flex items-center justify-center">
                    {activePips.has(idx) && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1B1B1B] shadow-inner" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-xs font-mono font-bold text-neutral-200 bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-full">
          Total: {dice[0] + dice[1]}
        </span>
        {isDoubles && (
          <span className="text-xs font-black text-neutral-950 bg-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500 animate-pulse">
            🎲 Doubles! Roll Again!
          </span>
        )}
      </div>

      <button
        onClick={rollDice}
        disabled={rolling}
        className="mt-3 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
      >
        {rolling ? 'Rolling...' : '🎲 Test Dice Roll'}
      </button>
    </div>
  );
}

/**
 * Visual Renderer: Tabletop Pawns & Track / Star Sanctuaries
 */
function TokensVisual() {
  const [selectedPawn, setSelectedPawn] = useState('red');

  const pawns = [
    { id: 'red', name: 'Ruby Red', color: '#D62F2F', tile: 'Track 14', status: 'Advancing around circuit' },
    { id: 'green', name: 'Emerald Green', color: '#2E9D5B', tile: 'Safe Star ⭐', status: 'Immune from capture on star' },
    { id: 'yellow', name: 'Amber Gold', color: '#F28C28', tile: 'Yard Base', status: 'Needs a 6 to liberate' },
    { id: 'blue', name: 'Sapphire Blue', color: '#2563EB', tile: 'Home Stretch', status: 'Needs exact roll to win' }
  ];

  const activePawnInfo = pawns.find(p => p.id === selectedPawn) || pawns[0];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl select-none">
      <div className="text-[10px] uppercase font-bold text-neutral-400 text-center mb-3">
        Track Segments & Pawn Status
      </div>

      {/* Mini Track Diagram */}
      <div className="flex items-center justify-between gap-1 bg-neutral-950 p-2 rounded-xl border border-neutral-800 mb-3 overflow-x-auto text-[10px]">
        <div className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold text-center shrink-0">
          Yard (Base)
        </div>
        <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
        <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-center shrink-0 flex items-center gap-1">
          <span>⭐</span>
          <span>Safe Star</span>
        </div>
        <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
        <div className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-bold text-center shrink-0">
          52-Tile Path
        </div>
        <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
        <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-center shrink-0">
          🏆 Home
        </div>
      </div>

      {/* 4 Colored Pawns Demo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {pawns.map(p => (
          <button
            key={p.id}
            onClick={() => { sounds.playClick?.(); setSelectedPawn(p.id); }}
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
              selectedPawn === p.id
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 scale-102'
                : 'bg-neutral-950/60 border-neutral-800 opacity-75 hover:opacity-100'
            }`}
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center font-bold text-[10px] text-white"
              style={{ backgroundColor: p.color }}
            >
              ♟
            </div>
            <span className="text-[11px] font-bold text-neutral-200">{p.name}</span>
            <span className="text-[9px] text-neutral-400">{p.tile}</span>
          </button>
        ))}
      </div>

      <div className="mt-2.5 text-center text-xs font-semibold text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg py-1 px-2">
        {activePawnInfo.name}: {activePawnInfo.status}
      </div>

      <p className="text-[10px] text-neutral-400 text-center mt-2 italic">
        Landing on an opponent outside safe stars captures them and earns a free roll!
      </p>
    </div>
  );
}

/**
 * Visual Renderer: Snakes, Ladders & Special Twists
 */
function SpecialVisual() {
  const [demoState, setDemoState] = useState('ladder');

  return (
    <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-4 shadow-xl select-none">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
        {/* Ladder Boost */}
        <div
          onClick={() => { sounds.playClick?.(); setDemoState('ladder'); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            demoState === 'ladder'
              ? 'bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="text-2xl mb-1">🪜</div>
          <div className="font-bold text-xs text-emerald-300">Ladder Boost</div>
          <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
            Foot at Tile 14 ➡️ Climbs up to Tile 38!
          </p>
        </div>

        {/* Snake Pitfall */}
        <div
          onClick={() => { sounds.playClick?.(); setDemoState('snake'); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            demoState === 'snake'
              ? 'bg-red-950/50 border-red-400 ring-2 ring-red-400/50 shadow-md'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-red-500/50'
          }`}
        >
          <div className="text-2xl mb-1">🐍</div>
          <div className="font-bold text-xs text-red-300">Snake Pitfall</div>
          <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
            Head at Tile 47 ➡️ Slithers down to Tile 26!
          </p>
        </div>

        {/* Exact 100 Bounce */}
        <div
          onClick={() => { sounds.playClick?.(); setDemoState('bounce'); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            demoState === 'bounce'
              ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-amber-500/50'
          }`}
        >
          <div className="text-2xl mb-1">🏁</div>
          <div className="font-bold text-xs text-amber-300">Exact 100 Rule</div>
          <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
            On 98, roll 5 ➡️ Bounce back to 97!
          </p>
        </div>
      </div>

      <div className="mt-3 text-center text-xs font-medium text-neutral-300 bg-neutral-950/80 border border-neutral-800 rounded-xl p-2">
        {demoState === 'ladder' && '🎉 Ladders give huge shortcuts! Land right on the bottom rung to soar.'}
        {demoState === 'snake' && '⚠️ Snakes drop you backward. Never leave your token 1 dice roll away from a snake head!'}
        {demoState === 'bounce' && '🎯 Tile 100 requires an exact roll. No overshooting allowed!'}
      </div>
    </div>
  );
}

/**
 * Visual Concept Switcher
 */
function GuideVisualRenderer({ visualType }) {
  switch (visualType) {
    case 'board':
      return <BoardVisual />;
    case 'cards':
      return <CardsVisual />;
    case 'dice':
      return <DiceVisual />;
    case 'tokens':
      return <TokensVisual />;
    case 'special':
    default:
      return <SpecialVisual />;
  }
}

/**
 * Reusable Global Hotkey Hook
 * Usage in callers: useGuideHotkey(() => setIsGuideOpen(prev => !prev));
 */
export function useGuideHotkey(onToggle) {
  useEffect(() => {
    if (!onToggle) return;

    const handleKeyDown = (e) => {
      // Never interfere when user is typing in inputs or textareas
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable ||
          activeEl.getAttribute('role') === 'textbox');

      if (isTyping) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);
}

/**
 * Interactive "How to Play" Modal Component
 */
export default function HowToPlayModal({
  isOpen,
  onClose,
  initialGameId = 'monopoly'
}) {
  const [activeGameId, setActiveGameId] = useState(() => normalizeGameId(initialGameId));
  const [stepIndex, setStepIndex] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const modalContainerRef = useRef(null);
  const handleNextStepRef = useRef();
  const handlePrevStepRef = useRef();

  // Sync initialGameId when modal opens
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setActiveGameId(normalizeGameId(initialGameId));
    setStepIndex(0);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Retrieve guide data from module or built-in fallback
  const resolvedGuide =
    getGuideForGame(activeGameId) ||
    GAME_GUIDES[activeGameId] ||
    FALLBACK_GUIDES[activeGameId] ||
    FALLBACK_GUIDES.monopoly;

  const steps = resolvedGuide.steps || [];
  const currentStep = steps[stepIndex] || steps[0] || {};
  const totalSteps = steps.length;

  // Handle Tab Switch
  const handleSelectTab = (tabId) => {
    sounds.playClick?.();
    setActiveGameId(tabId);
    setStepIndex(0);
  };

  // Step Navigation
  const handlePrevStep = () => {
    sounds.playClick?.();
    setStepIndex(i => Math.max(0, i - 1));
  };

  const handleNextStep = () => {
    sounds.playClick?.();
    setStepIndex(i => {
      if (i < totalSteps - 1) {
        return i + 1;
      }
      onClose();
      return i;
    });
  };

  useEffect(() => {
    handleNextStepRef.current = handleNextStep;
    handlePrevStepRef.current = handlePrevStep;
  });

  // Keyboard navigation inside open modal: ArrowLeft, ArrowRight, Escape, ?
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable ||
          activeEl.getAttribute('role') === 'textbox');

      if (isTyping) return;

      if (e.key === 'Escape' || e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        sounds.playClick?.();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStepRef.current?.();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStepRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playClick?.();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-body text-neutral-100 select-none overflow-y-auto"
    >
      <div
        ref={modalContainerRef}
        className="relative w-full max-w-3xl bg-[#1a110a] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-scale-up"
      >
        {/* Top Header & Game Tabs */}
        <div className="bg-neutral-950/90 border-b border-neutral-800 p-3 sm:p-4 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg">
                <HelpCircle className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h2 id="guide-title" className="text-base sm:text-lg font-black font-display tracking-tight text-neutral-100 uppercase">
                  Arcade Rulebook & Guides
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Interactive rules, visuals, and Munimji strategy tips
                </p>
              </div>
            </div>

            <button
              onClick={() => { sounds.playClick?.(); onClose(); }}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700"
              aria-label="Close guide modal"
              title="Close Guide (Esc or ?)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Game Selection Tabs */}
          <div role="tablist" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {GAME_TABS.map(tab => {
              const isActive = activeGameId === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 text-amber-200 shadow-md font-bold'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{tab.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-display font-black truncate">{tab.label}</span>
                    <span className="block text-[9px] text-neutral-500 uppercase font-semibold">{tab.badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Guide Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* Game Overview Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 border border-amber-600/30 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{resolvedGuide.icon === 'Store' ? '🕌' : resolvedGuide.icon === 'Layers' ? '🃏' : resolvedGuide.icon === 'Crosshair' ? '🎲' : resolvedGuide.icon === 'TrendingUp' ? '🐍' : (resolvedGuide.icon || '📖')}</span>
                <div>
                  <h3 className="font-display font-black text-sm sm:text-base text-neutral-100">
                    {resolvedGuide.title}
                  </h3>
                  <span className="text-[11px] text-neutral-400">{resolvedGuide.subtitle}</span>
                </div>
              </div>
              <span className="text-[10px] bg-neutral-800 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-neutral-700">
                {resolvedGuide.badge || resolvedGuide.playerCount}
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-amber-400 font-bold">Objective: </strong>
              {resolvedGuide.objective}
            </p>
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-display font-black text-amber-400 uppercase">
                Step {stepIndex + 1} of {totalSteps}:
              </span>
              <span className="text-xs font-bold text-neutral-200 truncate max-w-[200px] sm:max-w-md">
                {currentStep.title}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { sounds.playClick?.(); setStepIndex(idx); }}
                  aria-label={`Jump to step ${idx + 1}`}
                  className={`transition-all rounded-full cursor-pointer ${
                    idx === stepIndex
                      ? 'w-6 h-2 bg-amber-400 shadow-md shadow-amber-400/50'
                      : idx < stepIndex
                      ? 'w-2.5 h-2 bg-amber-600/80 hover:bg-amber-500'
                      : 'w-2 h-2 bg-neutral-700 hover:bg-neutral-600'
                  }`}
                  title={`Step ${idx + 1}: ${steps[idx]?.title || ''}`}
                />
              ))}
            </div>
          </div>

          {/* Step Description & Highlights */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
              {currentStep.description}
            </p>

            {currentStep.highlights && currentStep.highlights.length > 0 && (
              <ul className="space-y-1 pt-1 border-t border-neutral-800">
                {currentStep.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                    <span className="text-amber-400 text-sm leading-none shrink-0">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Interactive Visual Concept Diagram */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              <span>Interactive Concept Preview:</span>
              <span className="text-amber-400/80 font-normal lowercase">{currentStep.visualType} model</span>
            </div>
            <GuideVisualRenderer visualType={currentStep.visualType} />
          </div>

          {/* Munimji / Strategy Pro Tip Callout Box */}
          <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900/90 to-amber-950/60 border border-amber-500/50 shadow-lg shadow-amber-500/10 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
              👳🏾‍♂️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-amber-400 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Munimji's Pro Tip</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
                {currentStep.tip || 'Master this mechanic to turn the odds in your favor against seasoned merchants!'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="bg-neutral-950/90 border-t border-neutral-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-neutral-500 hidden sm:flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-[10px] text-neutral-400 font-mono">←</span>
            <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-[10px] text-neutral-400 font-mono">→</span>
            <span>Navigate</span>
            <span>•</span>
            <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-[10px] text-neutral-400 font-mono">ESC</span>
            <span>or</span>
            <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-[10px] text-neutral-400 font-mono">?</span>
            <span>Close</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrevStep}
              disabled={stepIndex === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNextStep}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs sm:text-sm font-black font-display shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {stepIndex < totalSteps - 1 ? (
                <>
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Got It! Let's Play</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
