/**
 * Guide Data Architecture for Bazaar Arcade
 * Interactive "How to Play" beginner guides for all supported arcade games.
 * 
 * Games:
 * 1. monopoly / bazaar-baron: Bazaar Baron (Real-Estate Trading)
 * 2. uno / bazaar-uno: Bazaar UNO (Card Game)
 * 3. ludo / bazaar-ludo: Bazaar Ludo (Tabletop Classic)
 * 4. snakes_and_ladders: Snakes & Ladders (Roll & Race)
 */

export const GAME_GUIDES = {
  monopoly: {
    gameId: 'monopoly',
    title: 'Bazaar Baron',
    subtitle: 'Classic Indian Real-Estate Trading & Strategy',
    icon: 'Store',
    badge: 'Fast-Paced LAN Monopoly',
    playerCount: '2 - 6 Players',
    playTime: '20 - 45 min',
    objective: 'Bankrupt all rival merchants by buying prized city properties, constructing Havelis & Hotels, and collecting royal rents!',
    steps: [
      {
        title: 'Rolling & Navigating the Bazaar',
        description: 'Roll two six-sided dice each turn to travel clockwise across 40 iconic bazaar squares. Roll doubles to earn an immediate extra turn! Whenever you land on or pass Start / Go, collect your ₹200 trading salary from the bank.',
        highlights: [
          '2 Six-sided dice with 3D tumble physics',
          'Clockwise perimeter travel across 40 tiles',
          'Collect ₹200 every time you pass Start / Go',
          'Rolling doubles gives an instant bonus roll',
          'Rolling 3 consecutive doubles sends you to Jail!'
        ],
        visualType: 'dice',
        tip: "Munimji's Wisdom: Shubh shuruwaat! Rolling doubles gives you fast momentum, but rolling three doubles in a row lands you behind bars in Central Jail. Pace your fortune!"
      },
      {
        title: 'Acquiring Properties & Public Auctions',
        description: 'Land on an unowned property (Delhi, Mumbai, Bengaluru, Transit Terminals, or Civic Utilities) to purchase it at face value. If you decline to buy, the property is immediately put up for open public auction where any merchant can bid!',
        highlights: [
          '8 Regional Color Groups & 22 city properties',
          '4 Transit Terminals (Howrah, CSMT, Chennai, New Delhi)',
          '2 Civic Utilities: Bijli Board & Pani Nigam (dice multipliers)',
          'Decline to buy triggers live multi-player auction'
        ],
        visualType: 'board',
        tip: "Munimji's Wisdom: Never let prime real estate go cheap in auctions! Even if you don't need a property, outbidding rivals stops them from locking down a monopoly."
      },
      {
        title: 'Color Monopolies & Haveli Construction',
        description: 'Acquire all properties in a color group to achieve a Monopoly! This doubles the base rent on unimproved lots and unlocks the power to construct up to 4 Havelis (houses) and upgrade to a Grand Haveli (Hotel) on each property.',
        highlights: [
          'Own complete color set to double unimproved rent',
          'Build up to 4 Havelis per property to multiply rent exponentially',
          'Upgrade 4 Havelis to a 5-star Grand Haveli (Hotel)',
          'Even-building rule: expand evenly across your color set',
          'Limited bank supply: 32 Havelis and 12 Hotels total'
        ],
        visualType: 'special',
        tip: "Munimji's Wisdom: Orange (Hyderabad Hills) and Red (Kolkata Avenues) are the most landed-on sets right after players exit Jail. Develop them early for devastating rent collection!"
      },
      {
        title: 'Kismat, Bazaar Fund & Central Jail',
        description: 'Landing on Kismat or Bazaar Fund reveals fateful event cards—from bumper Diwali profits to speed challans. Landing on "Go to Jail" detains you! Escape by rolling doubles, paying ₹50 bail fine, or playing a Get Out of Jail Free card.',
        highlights: [
          'Kismat (Chance) cards: surprise moves, bonuses & fines',
          'Bazaar Fund (Community) cards: community welfare & refunds',
          'Central Jail: detained until rolling doubles or paying ₹50',
          'After 3 failed jail turns, mandatory ₹50 release fine'
        ],
        visualType: 'cards',
        tip: "Munimji's Wisdom: In the late game when opponents have grand hotels everywhere, staying safe inside Central Jail for all 3 turns is often the smartest defensive play to avoid bankruptcy!"
      },
      {
        title: 'Trading, Mortgages & Bankruptcy',
        description: 'Negotiate deals with rivals at any time to exchange properties, cash, and jail cards. When cash runs low, mortgage properties for 50% value (unmortgage later with 10% interest). If you cannot pay a debt, declare bankruptcy and the last tycoon standing wins!',
        highlights: [
          'Player-to-player trading for cash, deeds, and jail cards',
          'Mortgage properties for 50% liquidity (0 rent while mortgaged)',
          'Unmortgage with 10% interest fee to resume rent collection',
          'Surrender all assets to creditor upon bankruptcy',
          'Last surviving solvent player is crowned Bazaar Baron!'
        ],
        visualType: 'tokens',
        tip: "Munimji's Wisdom: Don't hoard idle cash or sit on deadlocked single properties. Offer win-win trades to rival merchants so both of you can build havelis and eliminate the rest of the table!"
      }
    ]
  },

  uno: {
    gameId: 'uno',
    title: 'Bazaar UNO',
    subtitle: 'Fast-Paced Color & Number Card Sensation',
    icon: 'Layers',
    badge: 'Action Card Mayhem',
    playerCount: '2 - 10 Players',
    playTime: '5 - 15 min',
    objective: 'Be the first to empty your hand by matching colors, numbers, or actions. First player to accumulate 250 match points wins the crown!',
    steps: [
      {
        title: 'Dealing & Turn Matching',
        description: 'Every player starts with 7 cards. On your turn, match the top card of the discard pile by Color, Number (0-9), or Action Symbol. Wild cards can be legally played on top of any card at any time!',
        highlights: [
          '7 Cards dealt to each player',
          'Match by Color: Red, Blue, Green, or Yellow',
          'Match by Number: 0 through 9',
          'Match by Action Symbol: Skip on Skip, Reverse on Reverse',
          'Wild cards are universally playable anytime'
        ],
        visualType: 'cards',
        tip: "Munimji's Wisdom: Pay close attention to what color your opponents draw from the deck. If the player sitting after you had to draw on Blue, keep switching the game to Blue!"
      },
      {
        title: 'Action Cards: Skip, Reverse & Draw Two',
        description: 'Disrupt your opponents with tactical action cards! Skip bypasses the next player, Reverse flips play direction (or acts as a Skip in 1v1 duels), and Draw Two (+2) forces the next victim to draw 2 cards and forfeit their turn!',
        highlights: [
          'Skip: The next player loses their turn completely',
          'Reverse: Inverts turn direction (clockwise <-> counter-clockwise)',
          'In 2-player matches, Reverse acts as a direct Skip!',
          'Draw Two (+2): Next player draws 2 cards and is skipped',
          'Action cards are worth 20 points each in round scoring'
        ],
        visualType: 'special',
        tip: "Munimji's Wisdom: Save your Skips and Draw Two cards for when the player next to you is down to 2 or 3 cards. Striking them before they reach UNO is the key to victory!"
      },
      {
        title: 'Wild Cards & Color Changing',
        description: 'Play a standard Wild card to change the active color to whatever color you choose. Unleash the mighty Wild Draw Four (+4) to change the color AND force the next player to draw 4 cards while skipping their turn!',
        highlights: [
          'Wild: Choose any of the 4 colors to become active',
          'Wild Draw Four (+4): Choose color + next player draws 4 & is skipped',
          'Wild cards can be played on any card regardless of color',
          'Wild cards are worth 50 points each at round end'
        ],
        visualType: 'cards',
        tip: "Munimji's Wisdom: Wild Draw Four is your ultimate trump card! Save it for your penultimate turn so you can dictate the active color to match your final card for an effortless win."
      },
      {
        title: 'Calling UNO & Catching Penalties',
        description: 'The moment you play down to having just 1 single card left in your hand, you MUST shout UNO! If you fail to call UNO before the next player takes their turn, any sharp opponent can click "Catch UNO" to slap you with a +2 card penalty!',
        highlights: [
          'Must call UNO immediately when holding exactly 1 card',
          'Forget to call UNO? Any rival can catch you!',
          'Catching an opponent gives them a mandatory +2 card penalty',
          'Stay vigilant and watch other players’ hand counters'
        ],
        visualType: 'tokens',
        tip: "Munimji's Wisdom: Keep your eyes on the opponent hand counts! The second someone drops to 1 card without calling UNO, tap 'Catch UNO' immediately to derail their win!"
      },
      {
        title: 'Drawing Cards & Match Points',
        description: 'If you cannot play a legal card, draw 1 card from the deck. If the drawn card is playable, you may play it immediately; otherwise your turn passes. The first to empty their hand scores points from all opponents’ remaining cards (target: 250 pts)!',
        highlights: [
          'Draw 1 card when you have no valid move',
          'Play drawn card immediately if it matches',
          'Number cards score face value (0-9)',
          'Action cards score 20 pts, Wild cards score 50 pts',
          'First player to reach 250 total points wins the match!'
        ],
        visualType: 'dice',
        tip: "Munimji's Wisdom: Discard your high-scoring Wilds (50 pts) and Action cards (20 pts) early if you see an opponent about to go out. Don't let them feast on your point pool!"
      }
    ]
  },

  ludo: {
    gameId: 'ludo',
    title: 'Bazaar Ludo',
    subtitle: 'Royal Cross & Circle Strategy Board Game',
    icon: 'Crosshair',
    badge: '4-Player Tabletop Classic',
    playerCount: '2 - 4 Players',
    playTime: '15 - 30 min',
    objective: 'Navigate all 4 of your colored tokens out of the Yard, around the 52-tile perimeter track, and safely into your central Home Goal before rivals!',
    steps: [
      {
        title: 'The Yard & Rolling a 6 to Launch',
        description: 'All 4 of your colored tokens start locked in your Yard. Roll the 6-sided die on your turn. You MUST roll a 6 to mobilize a token out of the Yard onto your starting track space! Rolling a 6 also grants an immediate bonus roll.',
        highlights: [
          '4 Tokens per player: Red, Green, Yellow, Blue',
          'Tokens remain in Yard until a 6 is rolled',
          'Rolling a 6 moves token to starting tile',
          'Every 6 rolled earns an immediate bonus roll',
          'Rolling three 6s in a row forfeits your entire turn!'
        ],
        visualType: 'dice',
        tip: "Munimji's Wisdom: When you roll a 6 early, get multiple tokens out onto the track rather than racing just one ahead. Having options on every roll gives you maximum tactical flexibility!"
      },
      {
        title: 'Perimeter Circuit & Safe Star Tiles',
        description: 'Tokens travel clockwise around the 52-tile perimeter circuit. Scattered across the track are 8 designated Safe Star Tiles (including starting tiles) marked with ⭐. Tokens resting on safe stars are completely immune from captures!',
        highlights: [
          '52-tile shared perimeter track',
          'Clockwise progression around the board',
          '8 Safe Star Tiles (positions 0, 8, 13, 21, 26, 34, 39, 47)',
          'Safe stars protect tokens from all enemy attacks',
          'Multiple friendly or enemy tokens can share a safe star'
        ],
        visualType: 'board',
        tip: "Munimji's Wisdom: Always calculate your moves to land on Safe Star tiles whenever an opponent is stalking within 1 to 6 spaces behind you. Safety first in the bazaar!"
      },
      {
        title: 'Capturing Opponents & Bonus Rolls',
        description: 'If your token lands squarely on an opponent\'s token on an ordinary (non-safe) tile, you capture it! The captured token is sent all the way back to their Yard, and you are rewarded with an immediate bonus roll!',
        highlights: [
          'Landing on an enemy token on an ordinary tile captures it',
          'Captured token is banished back to the opponent Yard',
          'Capturing earns you an immediate bonus roll',
          'Tokens on Safe Stars cannot be captured'
        ],
        visualType: 'tokens',
        tip: "Munimji's Wisdom: Striking an opponent not only knocks their token back to square zero, but the extra roll bonus lets you immediately advance another token to safety!"
      },
      {
        title: 'Bonus Turns: 6s, Captures & Goals',
        description: 'Chain bonus rolls to control the board! You earn an extra turn whenever you roll a 6, capture an enemy piece, or guide a token into your Home Goal. But beware: rolling three consecutive 6s forfeits all moves for that turn!',
        highlights: [
          'Roll a 6 = Extra roll',
          'Capture enemy piece = Extra roll',
          'Token enters Home Goal = Extra roll',
          'Three 6s rule: Rolling 3 sixes in a row voids turn'
        ],
        visualType: 'special',
        tip: "Munimji's Wisdom: If you have already rolled two 6s, don't get reckless. Pray for any number other than a third 6 so your hard-won progress isn't wiped out by the forfeit rule!"
      },
      {
        title: 'Home Stretch & Exact Roll Victory',
        description: 'After completing a full 51-step lap around the board, your token turns into your color-exclusive Home Stretch path. You must roll the exact number needed to land in the central Home Goal. First player to bring all 4 tokens Home wins!',
        highlights: [
          '5-tile protected Home Stretch immune from rivals',
          'Exact roll required to enter the central Home Goal',
          'Overshooting rolls cannot be played on that token',
          'First player to get all 4 tokens Home is the Champion!',
          'Subsequent finishers take 2nd, 3rd, and 4th place'
        ],
        visualType: 'board',
        tip: "Munimji's Wisdom: Spread your pieces along the home stretch so that almost any dice roll (1, 2, 3, 4, 5, or 6) can successfully land at least one piece into the Goal!"
      }
    ]
  },

  snakes_and_ladders: {
    gameId: 'snakes_and_ladders',
    title: 'Snakes & Ladders',
    subtitle: 'Classic 100-Tile Race of Fortunes & Pitfalls',
    icon: 'TrendingUp',
    badge: 'Thrilling Roll & Race',
    playerCount: '2 - 6 Players',
    playTime: '10 - 20 min',
    objective: 'Be the first to navigate your pawn from Square 1 to the summit on Square 100, riding soaring ladders and dodging venomous snakes!',
    steps: [
      {
        title: 'The 100-Square Zigzag Grid',
        description: 'The board is a 10x10 grid with 100 numbered squares. All pawns start at Square 1 and advance in a serpentine zigzag path: moving left-to-right on row 1, right-to-left on row 2, and continuing back and forth upward to Square 100.',
        highlights: [
          '100 Numbered squares on a 10x10 grid',
          'Serpentine zigzag progression across rows',
          'Start at Square 1 and race to the summit on Square 100',
          'Multiplayer LAN support with AI bots'
        ],
        visualType: 'board',
        tip: "Munimji's Wisdom: Remember the zigzag track direction! Every time you reach a multiple of 10 (10, 20, 30...), the path turns upward and reverses direction across the next row."
      },
      {
        title: 'Rolling & Advancing Your Pawn',
        description: 'On your turn, roll the 6-sided die and watch your pawn smoothly advance forward across the tiles. Turns rotate clockwise among all connected players and AI bot merchants.',
        highlights: [
          'Single 6-sided die roll (1 to 6)',
          'Smooth automated pawn movement animations',
          'Real-time multiplayer synchronization across devices',
          'Quick, exciting, high-variance gameplay'
        ],
        visualType: 'dice',
        tip: "Munimji's Wisdom: In Snakes & Ladders, fortune can turn in a single roll! Even a merchant trailing far behind can vault to first place with one lucky ladder climb."
      },
      {
        title: 'Ladder Boosts: Skyward Shortcuts',
        description: 'Landing squarely on the bottom rung of a ladder immediately rockets your pawn up to the square at the top of the ladder! Super ladders can launch your pawn across 30 to 50 spaces in a single breathtaking bound.',
        highlights: [
          'Land on ladder base = Instant skyward climb',
          'Shortcuts past multiple rows of danger',
          'Key ladders: 4→14, 9→31, 20→38, 28→84, 51→67, 71→91',
          'Tile 28 is the golden ladder: leaps straight to 84!'
        ],
        visualType: 'special',
        tip: "Munimji's Wisdom: Aim for Square 28! Landing on 28 catapults you all the way to Square 84, vaulting you directly into the championship endgame."
      },
      {
        title: 'Snake Pitfalls: Treacherous Slides',
        description: 'Watch out for serpent heads! Landing on a square containing a snake\'s mouth forces your pawn to slide helplessly down its winding body to the tip of its tail, wiping out dozens of tiles of progress.',
        highlights: [
          'Land on snake head = Slide down to tail',
          'Wipes out multiple rows of hard-won progress',
          'The deadly viper at 87 drops you all the way to 24!',
          'Infamous summit snakes at 93, 95, and 99 guard the finish line'
        ],
        visualType: 'special',
        tip: "Munimji's Wisdom: Tension peaks in the 90s! Squares 93, 95, and 99 all house vicious snakes waiting to swallow frontrunners. Tread carefully!"
      },
      {
        title: 'The Final Sprint & Exact 100 Win',
        description: 'To claim the championship, your roll must land you EXACTLY on Square 100. If your roll overshoots 100, your pawn stays in place, waiting for your next turn. The first player to reach Square 100 wins with fanfare celebration!',
        highlights: [
          'Exact roll required to land on Square 100',
          'Overshooting rolls keep pawn waiting in place',
          'Unpredictable, nail-biting photo finishes',
          'Victory confetti and fanfare celebration for the winner!'
        ],
        visualType: 'tokens',
        tip: "Munimji's Wisdom: When parked on Square 98 or 99, be patient! Holding your ground is infinitely better than landing on the viper at 99 and sliding all the way back to 78."
      }
    ]
  }
};

/**
 * List of all supported games in canonical order.
 */
export const ALL_GAMES = ['monopoly', 'uno', 'ludo', 'snakes_and_ladders'];

/**
 * Retrieves the GameGuide object for a given game ID with robust alias handling.
 * 
 * Supports:
 * - 'monopoly', 'bazaar-baron', 'bazaar_baron', 'baron' -> monopoly
 * - 'uno', 'bazaar-uno', 'bazaar_uno' -> uno
 * - 'ludo', 'bazaar-ludo', 'bazaar_ludo' -> ludo
 * - 'snakes_and_ladders', 'snakes-and-ladders', 'snakes', 'snakes_ladders', 'snakesandladders' -> snakes_and_ladders
 * 
 * @param {string} gameId
 * @returns {object} GameGuide object
 */
export function getGuideForGame(gameId) {
  if (!gameId || typeof gameId !== 'string') {
    return GAME_GUIDES.monopoly;
  }

  const normalized = gameId.toLowerCase().trim().replace(/[-\s]/g, '_');

  if (normalized === 'monopoly' || normalized === 'bazaar_baron' || normalized === 'baron') {
    return GAME_GUIDES.monopoly;
  }
  if (normalized === 'uno' || normalized === 'bazaar_uno') {
    return GAME_GUIDES.uno;
  }
  if (normalized === 'ludo' || normalized === 'bazaar_ludo') {
    return GAME_GUIDES.ludo;
  }
  if (
    normalized === 'snakes_and_ladders' ||
    normalized === 'snakes' ||
    normalized === 'snakes_ladders' ||
    normalized === 'snakesandladders'
  ) {
    return GAME_GUIDES.snakes_and_ladders;
  }

  return GAME_GUIDES[normalized] || GAME_GUIDES.monopoly;
}
