import React, { useState, useEffect, useRef } from 'react';
import * as mke from 'mathkeyboardengine';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathKeyboardProps {
  onLatexChange: (latex: string) => void;
  initialLatex?: string;
}

export const MathKeyboard: React.FC<MathKeyboardProps> = ({ onLatexChange, initialLatex = '' }) => {
  const [latex, setLatex] = useState(initialLatex);
  const mathRef = useRef<HTMLDivElement>(null);
  const keyboardMemoryRef = useRef(new mke.KeyboardMemory());
  
  // A configuration is needed to format the latex
  const latexConfig = new mke.LatexConfiguration();

  const updateDisplay = () => {
    const newLatex = mke.getEditModeLatex(keyboardMemoryRef.current, latexConfig);
    const viewLatex = mke.getViewModeLatex(keyboardMemoryRef.current, latexConfig);
    
    setLatex(viewLatex);
    onLatexChange(viewLatex);

    if (mathRef.current) {
      katex.render(newLatex || '\\text{Enter math...}', mathRef.current, {
        throwOnError: false,
        displayMode: true,
      });
    }
  };

  useEffect(() => {
    updateDisplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyPress = (key: string) => {
    switch(key) {
      case 'left':
        mke.moveLeft(keyboardMemoryRef.current);
        break;
      case 'right':
        mke.moveRight(keyboardMemoryRef.current);
        break;
      case 'up':
        mke.moveUp(keyboardMemoryRef.current);
        break;
      case 'down':
        mke.moveDown(keyboardMemoryRef.current);
        break;
      case 'delete':
        mke.deleteLeft(keyboardMemoryRef.current);
        break;
      case 'fraction':
        mke.insert(keyboardMemoryRef.current, new mke.Fraction());
        break;
      case 'power':
        mke.insert(keyboardMemoryRef.current, new mke.Power());
        break;
      case 'sqrt':
        mke.insert(keyboardMemoryRef.current, new mke.SquareRoot());
        break;
      default:
        // Basic numbers and operators
        mke.insert(keyboardMemoryRef.current, new mke.StandardLeafNode(key));
    }
    updateDisplay();
  };

  return (
    <div className="math-keyboard-container">
      <div className="math-display" ref={mathRef}></div>
      <div className="math-keypad">
        <button type="button" className="math-key" onClick={() => handleKeyPress('7')}>7</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('8')}>8</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('9')}>9</button>
        <button type="button" className="math-key math-key--action" onClick={() => handleKeyPress('delete')}>⌫</button>
        
        <button type="button" className="math-key" onClick={() => handleKeyPress('4')}>4</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('5')}>5</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('6')}>6</button>
        <button type="button" className="math-key math-key--action" onClick={() => handleKeyPress('fraction')}>a/b</button>
        
        <button type="button" className="math-key" onClick={() => handleKeyPress('1')}>1</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('2')}>2</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('3')}>3</button>
        <button type="button" className="math-key math-key--action" onClick={() => handleKeyPress('power')}>x²</button>
        
        <button type="button" className="math-key" onClick={() => handleKeyPress('0')}>0</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('.')}>.</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('+')}>+</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('-')}>-</button>
        
        <button type="button" className="math-key" onClick={() => handleKeyPress('left')}>◀</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('right')}>▶</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('up')}>▲</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('down')}>▼</button>

        <button type="button" className="math-key" onClick={() => handleKeyPress('=')}>=</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('x')}>x</button>
        <button type="button" className="math-key" onClick={() => handleKeyPress('y')}>y</button>
        <button type="button" className="math-key math-key--action" onClick={() => handleKeyPress('sqrt')}>√</button>
      </div>
    </div>
  );
};
