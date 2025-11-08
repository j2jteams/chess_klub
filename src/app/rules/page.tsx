'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components/layout';
import { ChevronDown, ChevronUp, Lightbulb, Clock, Crown, Zap, BookOpen, Trophy, Target, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface RuleCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  content: React.ReactNode;
  fact?: string;
}

export default function RulesPage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [masteryProgress, setMasteryProgress] = useState(0);

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
    if (expandedCard !== id) {
      setMasteryProgress(prev => Math.min(prev + 10, 100));
    }
  };

  const ruleCards: RuleCard[] = [
    {
      id: 'pawn',
      title: 'Pawn Movement & Promotion',
      icon: <span className="text-2xl">♙</span>,
      description: 'Learn how pawns move, capture, and promote to powerful pieces.',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Basic Movement</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Pawns move <strong>forward</strong> one square at a time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>On their <strong>first move</strong>, pawns can move two squares forward</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Pawns <strong>capture diagonally</strong> one square forward</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Promotion</h3>
            <p className="text-sm mb-2">When a pawn reaches the 8th rank (opponent's back row), it must be promoted to:</p>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {['♕', '♖', '♗', '♘'].map((piece, i) => (
                <div key={i} className="bg-background p-3 rounded-lg text-center border border-primary/20">
                  <span className="text-2xl block mb-1">{piece}</span>
                  <span className="text-xs text-muted-foreground">
                    {['Queen', 'Rook', 'Bishop', 'Knight'][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">Note: You cannot promote to a King!</p>
          </div>
        </div>
      ),
      fact: 'A pawn that reaches the 8th rank must be promoted — even if it gives checkmate!'
    },
    {
      id: 'knight',
      title: 'Knight Moves & Forks',
      icon: <span className="text-2xl">♘</span>,
      description: 'Master the unique L-shaped movement and tactical forks.',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Movement Pattern</h3>
            <p className="text-sm mb-3">The knight moves in an <strong>L-shape</strong>: two squares in one direction, then one square perpendicular.</p>
            <div className="grid grid-cols-3 gap-2 bg-background p-3 rounded-lg border border-primary/20">
              {['↗', '↖', '↘', '↙', '→', '←', '↑', '↓'].map((arrow, i) => (
                <div key={i} className="text-center text-lg opacity-60">{arrow}</div>
              ))}
            </div>
            <ul className="space-y-2 text-sm mt-3">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Knights are the <strong>only pieces</strong> that can jump over other pieces</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>They capture by landing on an opponent's piece</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Tactical Forks</h3>
            <p className="text-sm">A fork occurs when a knight attacks two or more pieces simultaneously. This is one of the most powerful tactical weapons in chess!</p>
          </div>
        </div>
      ),
      fact: 'The knight is the only piece that can attack all eight squares around it without being blocked!'
    },
    {
      id: 'castling',
      title: 'Castling Explained',
      icon: <span className="text-2xl">♖</span>,
      description: 'Learn the special move that protects your king and activates your rook.',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What is Castling?</h3>
            <p className="text-sm mb-3">Castling is a special move that involves both the <strong>king</strong> and a <strong>rook</strong>. It's the only move where two pieces move at once!</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-background p-3 rounded-lg border border-primary/20">
                <div className="text-center mb-2">
                  <span className="text-2xl">♔</span>
                  <span className="text-2xl mx-2">→</span>
                  <span className="text-2xl">♖</span>
                </div>
                <p className="text-xs text-center font-semibold">Kingside</p>
                <p className="text-xs text-center text-muted-foreground mt-1">King moves 2 squares right</p>
              </div>
              <div className="bg-background p-3 rounded-lg border border-primary/20">
                <div className="text-center mb-2">
                  <span className="text-2xl">♖</span>
                  <span className="text-2xl mx-2">→</span>
                  <span className="text-2xl">♔</span>
                </div>
                <p className="text-xs text-center font-semibold">Queenside</p>
                <p className="text-xs text-center text-muted-foreground mt-1">King moves 2 squares left</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Rules for Castling</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Neither the king nor the rook can have moved before</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>There must be no pieces between the king and rook</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>The king cannot be in check</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>The king cannot move through or into check</span>
              </li>
            </ul>
          </div>
        </div>
      ),
      fact: 'Castling was introduced in the 15th century to speed up the game and protect the king!'
    },
    {
      id: 'check',
      title: 'Check, Checkmate, and Stalemate',
      icon: <span className="text-2xl">♔</span>,
      description: 'Understand the critical game-ending conditions.',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-semibold text-red-600">Check</h3>
              </div>
              <p className="text-sm">The king is under attack. You <strong>must</strong> get out of check on your next move.</p>
              <p className="text-xs text-muted-foreground mt-2">Ways to escape: Move the king, block the attack, or capture the attacking piece.</p>
            </div>
            <div className="bg-gradient-to-br from-red-600/10 to-red-700/10 p-4 rounded-lg border border-red-600/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💀</span>
                <h3 className="font-semibold text-red-700">Checkmate</h3>
              </div>
              <p className="text-sm">The king is in check and <strong>cannot escape</strong>. The game ends immediately.</p>
              <p className="text-xs text-muted-foreground mt-2">The player in checkmate loses the game.</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🤝</span>
                <h3 className="font-semibold text-yellow-600">Stalemate</h3>
              </div>
              <p className="text-sm">The king is <strong>not in check</strong> but has no legal moves. The game ends in a <strong>draw</strong>.</p>
              <p className="text-xs text-muted-foreground mt-2">This is a draw, not a win for either player.</p>
            </div>
          </div>
        </div>
      ),
      fact: 'The fastest possible checkmate is called "Fool\'s Mate" and can happen in just 2 moves!'
    },
    {
      id: 'special',
      title: 'Special Moves & Illegal Positions',
      icon: <span className="text-2xl">⚡</span>,
      description: 'Master en passant and understand what makes a position illegal.',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              En Passant
            </h3>
            <p className="text-sm mb-3">A special pawn capture that can only occur immediately after a pawn moves two squares forward from its starting position.</p>
            <div className="bg-background p-4 rounded-lg border border-primary/20">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">♟</div>
                    <p className="text-xs">Opponent's pawn</p>
                  </div>
                  <span className="text-xl">→</span>
                  <div className="text-center">
                    <div className="text-2xl mb-1">♙</div>
                    <p className="text-xs">Your pawn</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">If your pawn is on the 5th rank and the opponent moves two squares, you can capture "en passant" as if they only moved one square.</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Illegal Positions</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-destructive font-bold">✗</span>
                <span>Both kings cannot be in check simultaneously</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-bold">✗</span>
                <span>A king cannot move into check</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive font-bold">✗</span>
                <span>You cannot make a move that leaves your own king in check</span>
              </li>
            </ul>
          </div>
        </div>
      ),
      fact: 'En passant is French for "in passing" — you capture the pawn as it passes by!'
    },
    {
      id: 'clock',
      title: 'Chess Clock & Tournament Etiquette',
      icon: <Clock className="h-6 w-6" />,
      description: 'Learn proper tournament conduct and time management.',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Chess Clock Basics
            </h3>
            <p className="text-sm mb-3">In tournament play, each player has a limited amount of time to make all their moves.</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-background p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-semibold mb-1">Time Control</p>
                <p className="text-sm">e.g., 90 minutes + 30 seconds per move</p>
              </div>
              <div className="bg-background p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-semibold mb-1">Flag Fall</p>
                <p className="text-sm">If your time runs out, you lose (unless opponent cannot checkmate)</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Tournament Etiquette</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Touch-move rule:</strong> If you touch a piece, you must move it (if legal)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Adjust pieces:</strong> Say "J'adoube" (I adjust) before touching pieces to adjust them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Respect silence:</strong> Keep noise to a minimum during games</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>Handshake:</strong> It's customary to shake hands before and after the game</span>
              </li>
            </ul>
          </div>
        </div>
      ),
      fact: 'The longest recorded chess game lasted 269 moves and ended in a draw!'
    }
  ];

  const didYouKnowFacts = [
    { icon: '🕰️', text: 'The en passant rule was introduced in the 15th century to prevent pawns from bypassing each other.' },
    { icon: '♚', text: 'The word "checkmate" comes from the Persian phrase "shah mat" meaning "the king is helpless".' },
    { icon: '♟️', text: 'A pawn that reaches the 8th rank must be promoted — even if it gives checkmate!' },
    { icon: '⚡', text: 'The fastest possible checkmate is "Fool\'s Mate" and can happen in just 2 moves!' },
    { icon: '🎯', text: 'There are more possible games of chess than atoms in the observable universe!' },
    { icon: '👑', text: 'The longest chess game theoretically possible would last 5,949 moves.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 gap-1 h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`${(Math.floor(i / 8) + i) % 2 === 0 ? 'bg-primary/20' : 'bg-accent/20'}`}
                />
              ))}
            </div>
          </div>
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="text-center">
              <div className="inline-block mb-6">
                <div className="flex items-center gap-3 bg-gradient-to-r from-primary/20 to-accent/20 px-6 py-3 rounded-full border border-primary/30">
                  <Crown className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold text-primary">Master the Game</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Know the Rules
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Every champion started with the basics — explore the official rules of chess with interactive examples and visual guides.
              </p>
              <button
                onClick={() => {
                  document.getElementById('rules-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Start Learning
              </button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-12">
            {/* Main Content */}
            <div className="lg:col-span-3" id="rules-section">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Interactive Rule Explorer</h2>
                <p className="text-muted-foreground">Click on any rule card to expand and learn more</p>
              </div>

              <div className="space-y-4">
                {ruleCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleCard(card.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-lg text-primary-foreground">
                          {card.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold mb-1">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        </div>
                      </div>
                      {expandedCard === card.id ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary" />
                      )}
                    </button>
                    {expandedCard === card.id && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                        {card.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-8 bg-card border border-primary/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Rule Mastery Progress</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{masteryProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                    style={{ width: `${masteryProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {masteryProgress < 100
                    ? `Keep exploring rules to increase your mastery!`
                    : `🎉 Congratulations! You've mastered all the rules!`}
                </p>
              </div>
            </div>

            {/* Sidebar - Did You Know */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-card border-2 border-primary/20 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Did You Know?</h3>
                  </div>
                  <div className="space-y-4">
                    {didYouKnowFacts.map((fact, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-primary/5 to-accent/5 p-4 rounded-lg border border-primary/10"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{fact.icon}</span>
                          <p className="text-sm leading-relaxed">{fact.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ready to Compete Section */}
          <section className="py-16 my-12">
            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 md:p-12 border-2 border-primary/20 shadow-xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Ready to Compete?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Now that you know the rules, test your skills and join the chess community!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Link
                  href="/events"
                  className="bg-card border-2 border-primary/20 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Join Events</h3>
                  <p className="text-sm text-muted-foreground">Browse and register for upcoming chess tournaments and events in your area.</p>
                </Link>
                <button
                  disabled
                  className="bg-card border-2 border-primary/20 rounded-xl p-6 opacity-60 cursor-not-allowed"
                  title="Coming soon"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg mb-4">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Take the Quiz</h3>
                  <p className="text-sm text-muted-foreground">Test your knowledge with our official chess rules quiz.</p>
                </button>
                <button
                  disabled
                  className="bg-card border-2 border-primary/20 rounded-xl p-6 opacity-60 cursor-not-allowed"
                  title="Coming soon"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg mb-4">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Weekly Sessions</h3>
                  <p className="text-sm text-muted-foreground">Join our weekly chess practice sessions and improve your game.</p>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

