'use client';

import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface CustomChessBoardProps {
  game: Chess;
  onMove: (from: string, to: string) => boolean;
  boardWidth?: number;
  disabled?: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function CustomChessBoard({ 
  game, 
  onMove, 
  boardWidth = 480,
  disabled = false 
}: CustomChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  const getSquareName = (file: number, rank: number): string => {
    return `${FILES[file]}${RANKS[rank]}`;
  };

  const handleSquareClick = useCallback((square: string) => {
    if (disabled || game.turn() !== 'w') return;

    const piece = game.get(square as any);

    // If clicking on the same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // If a square is already selected
    if (selectedSquare) {
      // Check if clicking on a possible move square
      if (possibleMoves.includes(square)) {
        // Make the move
        const success = onMove(selectedSquare, square);
        if (success) {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      } else {
        // Clicking on a different square
        if (piece && piece.color === 'w') {
          // Select new white piece
          setSelectedSquare(square);
          const moves = game.moves({ square: square as any, verbose: true });
          setPossibleMoves(moves.map(m => m.to));
        } else {
          // Deselect if clicking on empty square or opponent piece
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      }
    } else {
      // No square selected - select if it's a white piece
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
        const moves = game.moves({ square: square as any, verbose: true });
        setPossibleMoves(moves.map(m => m.to));
      }
    }
  }, [selectedSquare, possibleMoves, game, onMove, disabled]);

  // Reset selection when game changes
  React.useEffect(() => {
    if (game.turn() === 'b') {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }, [game.fen()]);

  // Calculate custom square styles for highlighting
  const getCustomSquareStyles = () => {
    const styles: Record<string, React.CSSProperties> = {};
    
    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        borderRadius: '50%'
      };
    }
    
    // Highlight possible move squares
    possibleMoves.forEach(square => {
      styles[square] = {
        background: 'radial-gradient(circle, rgba(0, 255, 0, 0.4) 36%, transparent 40%)',
        borderRadius: '50%'
      };
    });
    
    return styles;
  };

  // Aggressively prevent dragging
  React.useEffect(() => {
    const preventDrag = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'none';
      }
      return false;
    };

    // Get all chess board elements
    const boardElements = document.querySelectorAll('.react-chessboard, .react-chessboard *');
    
    boardElements.forEach((el) => {
      // Prevent all drag events
      el.addEventListener('dragstart', preventDragStart, { capture: true, passive: false });
      el.addEventListener('drag', preventDrag, { capture: true, passive: false });
      el.addEventListener('dragover', preventDrag, { capture: true, passive: false });
      el.addEventListener('dragenter', preventDrag, { capture: true, passive: false });
      el.addEventListener('dragleave', preventDrag, { capture: true, passive: false });
      el.addEventListener('drop', preventDrag, { capture: true, passive: false });
      el.addEventListener('dragend', preventDrag, { capture: true, passive: false });
      
      // Set draggable to false on all elements
      if (el instanceof HTMLElement) {
        el.draggable = false;
        el.setAttribute('draggable', 'false');
        (el.style as any).userSelect = 'none';
        (el.style as any).webkitUserDrag = 'none';
      }
    });

    // Use MutationObserver to catch dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            if (element.closest('.react-chessboard')) {
              element.addEventListener('dragstart', preventDragStart, { capture: true, passive: false });
              element.addEventListener('drag', preventDrag, { capture: true, passive: false });
              if (element instanceof HTMLElement) {
                element.draggable = false;
                element.setAttribute('draggable', 'false');
                (element.style as any).userSelect = 'none';
                (element.style as any).webkitUserDrag = 'none';
              }
            }
          }
        });
      });
    });

    const boardContainer = document.querySelector('.react-chessboard');
    if (boardContainer) {
      observer.observe(boardContainer, { childList: true, subtree: true });
    }

    return () => {
      boardElements.forEach((el) => {
        el.removeEventListener('dragstart', preventDragStart, { capture: true } as any);
        el.removeEventListener('drag', preventDrag, { capture: true } as any);
        el.removeEventListener('dragover', preventDrag, { capture: true } as any);
        el.removeEventListener('dragenter', preventDrag, { capture: true } as any);
        el.removeEventListener('dragleave', preventDrag, { capture: true } as any);
        el.removeEventListener('drop', preventDrag, { capture: true } as any);
        el.removeEventListener('dragend', preventDrag, { capture: true } as any);
      });
      observer.disconnect();
    };
  }, [game.fen()]); // Re-run when board updates

  return (
    <div className="w-full flex justify-center">
      {/* Use react-chessboard for visuals but with click-only interaction */}
      <Chessboard
        {...({
          position: game.fen(),
          onSquareClick: handleSquareClick,
          arePiecesDraggable: false,
          areArrowsAllowed: false,
          boardWidth: boardWidth,
          customBoardStyle: {
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto'
          },
          customDarkSquareStyle: { backgroundColor: '#769656' },
          customLightSquareStyle: { backgroundColor: '#eeeed2' },
          customSquareStyles: getCustomSquareStyles(),
          onPieceDragBegin: () => false,
          onPieceDrag: () => false,
          onPieceDrop: () => false
        } as any)}
      />
    </div>
  );
}

