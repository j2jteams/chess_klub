'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Settings, Crown, Target, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomChessBoard from '@/components/chess/CustomChessBoard';
import type React from 'react';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

interface DifficultyConfig {
  name: string;
  elo: number;
  depth: number;
  description: string;
  icon: React.ReactElement;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    name: 'Beginner',
    elo: 800,
    depth: 1,
    description: 'Perfect for learning the basics',
    icon: <Target className="h-5 w-5" />
  },
  intermediate: {
    name: 'Intermediate',
    elo: 1200,
    depth: 2,
    description: 'Good for developing players',
    icon: <TrendingUp className="h-5 w-5" />
  },
  advanced: {
    name: 'Advanced',
    elo: 1600,
    depth: 3,
    description: 'Challenging for experienced players',
    icon: <Zap className="h-5 w-5" />
  },
  expert: {
    name: 'Expert',
    elo: 2000,
    depth: 4,
    description: 'Very strong opponent',
    icon: <Crown className="h-5 w-5" />
  },
  master: {
    name: 'Master',
    elo: 2400,
    depth: 5,
    description: 'Grandmaster level challenge',
    icon: <Trophy className="h-5 w-5" />
  }
};

// Simple minimax algorithm for computer moves
function minimax(
  game: Chess,
  depth: number,
  isMaximizing: boolean,
  alpha: number = -Infinity,
  beta: number = Infinity
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluatePosition(game);
  }

  const moves = game.moves({ verbose: true });
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, false, alpha, beta);
      game.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, true, alpha, beta);
      game.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return minEval;
  }
}

function evaluatePosition(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -10000 : 10000;
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  const board = game.board();
  let score = 0;

  const pieceValues: Record<string, number> = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
  };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = pieceValues[piece.type] || 0;
        score += piece.color === 'w' ? value : -value;
      }
    }
  }

  return score;
}

function getBestMove(game: Chess, depth: number): any {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  let bestMove: any = moves[0];
  let bestValue = Infinity; // Computer (black) wants to minimize (negative scores favor black)

  for (const move of moves) {
    // Make the move on a copy of the game
    const gameCopy = new Chess(game.fen());
    gameCopy.move(move);
    
    // After computer (black) moves, it's player's (white) turn
    // White wants to maximize, so we evaluate with isMaximizing=true
    // Then we minimize from black's perspective
    const value = minimax(gameCopy, depth - 1, true, -Infinity, Infinity);

    // Computer (black) wants to minimize the value (negative = good for black)
    if (value < bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  return bestMove;
}

export default function PlayChessPage() {
  const [game, setGame] = useState(new Chess());
  const [playerRating, setPlayerRating] = useState(1200);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [gameHistory, setGameHistory] = useState<Array<{ result: string; opponentElo: number; date: string }>>([]);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [boardWidth, setBoardWidth] = useState(600);

  // Load game history from localStorage and set board width
  useEffect(() => {
    const savedHistory = localStorage.getItem('chessGameHistory');
    if (savedHistory) {
      setGameHistory(JSON.parse(savedHistory));
    }
    const savedRating = localStorage.getItem('chessPlayerRating');
    if (savedRating) {
      setPlayerRating(parseInt(savedRating));
    }
    
    // Set responsive board width
    const updateBoardWidth = () => {
      const width = Math.min(800, window.innerWidth - 200);
      setBoardWidth(Math.max(480, width));
    };
    updateBoardWidth();
    window.addEventListener('resize', updateBoardWidth);
    return () => window.removeEventListener('resize', updateBoardWidth);
  }, []);

  // Save game history to localStorage
  const saveGameHistory = useCallback((result: string, opponentElo: number) => {
    const newHistory = [
      ...gameHistory,
      {
        result,
        opponentElo,
        date: new Date().toISOString()
      }
    ];
    setGameHistory(newHistory);
    localStorage.setItem('chessGameHistory', JSON.stringify(newHistory));
  }, [gameHistory]);

  // Update rating based on game result
  const updateRating = useCallback((result: 'win' | 'loss' | 'draw', opponentElo: number) => {
    const kFactor = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerRating) / 400));
    let actualScore = 0.5;
    if (result === 'win') actualScore = 1;
    if (result === 'loss') actualScore = 0;

    const newRating = Math.round(playerRating + kFactor * (actualScore - expectedScore));
    setPlayerRating(newRating);
    localStorage.setItem('chessPlayerRating', newRating.toString());
  }, [playerRating]);

  // Make computer move
  const makeComputerMove = useCallback(() => {
    console.log('makeComputerMove called:', { turn: game.turn(), isGameOver: game.isGameOver(), isComputerThinking });
    
    // Double check it's computer's turn
    if (game.isGameOver() || game.turn() !== 'b' || isComputerThinking) {
      console.log('Computer move skipped');
      return;
    }

    setIsComputerThinking(true);
    
    // Use setTimeout to allow UI to update and show "thinking" state
    setTimeout(() => {
      try {
        const config = DIFFICULTIES[difficulty];
        const gameCopy = new Chess(game.fen());
        console.log('Getting best move for computer...');
        const bestMove = getBestMove(gameCopy, config.depth);
        
        if (!bestMove) {
          console.log('No best move found');
          setIsComputerThinking(false);
          return;
        }
        
        console.log('Computer making move:', bestMove);
        const moveResult = gameCopy.move(bestMove);
        
        if (moveResult) {
          console.log('Computer move successful:', moveResult.san);
          setGame(gameCopy);
          const moveNotation = moveResult.san || `${bestMove.from}${bestMove.to}${bestMove.promotion || ''}`;
          setMoveHistory(prev => [...prev, moveNotation]);
          
          // Check game status after computer move
          if (gameCopy.isGameOver()) {
            setTimeout(() => {
              let result: 'win' | 'loss' | 'draw' = 'draw';
              if (gameCopy.isCheckmate()) {
                // After checkmate, turn switches to the losing side
                // If it's white's turn after checkmate, white lost (player lost)
                result = gameCopy.turn() === 'w' ? 'loss' : 'win';
              }
              
              const opponentElo = DIFFICULTIES[difficulty].elo;
              updateRating(result, opponentElo);
              saveGameHistory(result, opponentElo);
            }, 500);
          }
        } else {
          console.log('Computer move failed');
        }
      } catch (error) {
        console.error('Error making computer move:', error);
      } finally {
        setIsComputerThinking(false);
      }
    }, 500); // Reduced delay for better responsiveness
  }, [game, difficulty, updateRating, saveGameHistory, isComputerThinking]);

  // Handle player move - called by CustomChessBoard
  const handlePlayerMove = useCallback((from: string, to: string): boolean => {
    // Don't allow moves when it's not player's turn or game is over
    if (game.turn() !== 'w' || game.isGameOver() || isComputerThinking) {
      return false;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from,
        to,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move === null) {
        return false;
      }

      // Update game state
      setGame(gameCopy);
      
      // Add move to history
      const moveNotation = move.san || `${from}${to}`;
      setMoveHistory(prev => [...prev, moveNotation]);

      // Check game status after player move
      if (gameCopy.isGameOver()) {
        setTimeout(() => {
          let result: 'win' | 'loss' | 'draw' = 'draw';
          if (gameCopy.isCheckmate()) {
            result = gameCopy.turn() === 'w' ? 'loss' : 'win';
          }
          
          const opponentElo = DIFFICULTIES[difficulty].elo;
          updateRating(result, opponentElo);
          saveGameHistory(result, opponentElo);
        }, 500);
      }

      return true;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  }, [game, isComputerThinking, difficulty, updateRating, saveGameHistory]);

  // Trigger computer move after player move
  useEffect(() => {
    // Only trigger if it's black's turn (computer's turn) and game is not over
    if (game.turn() === 'b' && !game.isGameOver() && !isComputerThinking) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 300); // Small delay to allow UI to update
      return () => clearTimeout(timer);
    }
  }, [game.fen(), isComputerThinking, makeComputerMove]);

  // Reset game
  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
  };

  // Get game status message
  const getGameStatus = () => {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? 'You Lost!' : 'You Won! 🎉';
    }
    if (game.isDraw()) {
      return 'Draw!';
    }
    if (game.isStalemate()) {
      return 'Stalemate!';
    }
    if (game.isCheck()) {
      return 'Check!';
    }
    if (isComputerThinking) {
      return 'Computer is thinking...';
    }
    return game.turn() === 'w' ? 'Your Turn' : "Computer's Turn";
  };

  const config = DIFFICULTIES[difficulty];
  const winRate = gameHistory.length > 0 
    ? (gameHistory.filter(g => g.result === 'win').length / gameHistory.length * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Stats & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Player Rating Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary">Your Rating</h3>
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {playerRating}
              </div>
              <p className="text-sm text-muted-foreground">
                {playerRating < 1000 && 'Novice'}
                {playerRating >= 1000 && playerRating < 1200 && 'Beginner'}
                {playerRating >= 1200 && playerRating < 1400 && 'Intermediate'}
                {playerRating >= 1400 && playerRating < 1600 && 'Advanced'}
                {playerRating >= 1600 && playerRating < 1800 && 'Expert'}
                {playerRating >= 1800 && playerRating < 2000 && 'Master'}
                {playerRating >= 2000 && 'Grandmaster'}
              </p>
            </motion.div>

            {/* Difficulty Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-primary/30 rounded-xl p-6 shadow-lg text-foreground"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Difficulty</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDifficultyModal(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Change
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {config.icon}
                <div>
                  <div className="font-bold text-lg">{config.name}</div>
                  <div className="text-sm text-muted-foreground">ELO: {config.elo}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
            </motion.div>

            {/* Game Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-primary/30 rounded-xl p-6 shadow-lg text-foreground"
            >
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Games Played</span>
                  <span className="font-bold">{gameHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-bold">{winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="font-bold text-green-500">
                    {gameHistory.filter(g => g.result === 'win').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Losses</span>
                  <span className="font-bold text-red-500">
                    {gameHistory.filter(g => g.result === 'loss').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Draws</span>
                  <span className="font-bold text-yellow-500">
                    {gameHistory.filter(g => g.result === 'draw').length}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center - Chess Board */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Status */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30 rounded-xl p-4 shadow-lg">
                <h2 className="text-2xl font-bold mb-2">{getGameStatus()}</h2>
                <p className="text-sm text-muted-foreground">
                  Playing against {config.name} (ELO {config.elo})
                </p>
              </div>
            </motion.div>

            {/* Chess Board */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-2 border-primary/30 rounded-xl p-6 shadow-2xl"
            >
              <div className="w-full flex justify-center">
                <CustomChessBoard
                  game={game}
                  onMove={handlePlayerMove}
                  boardWidth={Math.min(800, boardWidth)}
                  disabled={isComputerThinking || game.turn() !== 'w' || game.isGameOver()}
                />
              </div>
            </motion.div>

            {/* Game Controls */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={resetGame}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                New Game
              </Button>
            </div>
          </div>

        </div>
      </main>

      {/* Difficulty Selection Modal */}
      <AnimatePresence>
        {showDifficultyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDifficultyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-primary/30 rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-4">Select Difficulty</h3>
              <div className="space-y-3">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diff) => {
                  const diffConfig = DIFFICULTIES[diff];
                  const isSelected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => {
                        setDifficulty(diff);
                        setShowDifficultyModal(false);
                        resetGame();
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-primary/20 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {diffConfig.icon}
                        <div className="flex-1">
                          <div className="font-bold">{diffConfig.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ELO {diffConfig.elo} • {diffConfig.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

