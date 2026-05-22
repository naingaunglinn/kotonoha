'use client'
import {BasicCharProps} from "@/types";
import {useEffect, useRef, useState, useCallback} from "react";
import {Eraser, ChevronLeft, Volume2} from 'lucide-react';
import {useParams} from "next/navigation";
import Link from "next/link";
import { getDataUrl } from "@/utils/dataUrl";

const Char = () => {
  const params = useParams<{ kana: string; char: string }>();
  const { kana, char } = params!;
  const [character, setCharacter] = useState<BasicCharProps>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const fetchCharacter = useCallback(async (char: string) => {
    const response = await fetch(getDataUrl(`/data/character/${kana}.json`), {
      cache: 'no-store'
    });
    // Throw an error if the network response is not ok (e.g., 404 Not Found)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Parse the JSON data from the response
    const data: { characters: BasicCharProps[] }[] = await response.json();
    // Flatten the array of groups into a single array of character objects
    const allCharacters = data.flatMap(group => group.characters);
    // Find the character where the kana or romaji matches the input 'char'
    const foundCharacter = allCharacters.find(
      (c) => c.kana === char || c.romaji === char
    );
    console.log(foundCharacter);
    setCharacter(foundCharacter);
  }, [kana]);

  useEffect(() => {
    fetchCharacter(char);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 10;
    context.strokeStyle = '#1F150C';
  }, [char, fetchCharacter]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    console.log(nativeEvent);
    const { offsetX, offsetY } = getCoords(nativeEvent as MouseEvent | TouchEvent);
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoords(nativeEvent as MouseEvent | TouchEvent);
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const getCoords = (event: MouseEvent | TouchEvent) => {
    if ('touches' in event && event.touches && event.touches.length > 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { offsetX: 0, offsetY: 0 };
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top,
      };
    }
    console.log(event);
    return { offsetX: (event as MouseEvent).offsetX, offsetY: (event as MouseEvent).offsetY };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="max-w-5xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="relative text-center mb-16 max-w-3xl mx-auto">
        <Link href={`/module/${kana}`} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-[#1F150C]/10 transition-colors duration-300">
          <ChevronLeft className="h-6 w-6 text-[#1F150C]" />
        </Link>
      </div>
      <div className="bg-[#E1DCC9] rounded-3xl shadow-2xl w-full max-w-4xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative animate-fade-in">
        {/* Character Info */}
        <div className="flex flex-col items-center justify-center bg-white/50 rounded-2xl p-6 border border-black/5">
          <h1 className="text-9xl font-bold text-[#1F150C]">{character?.kana}</h1>
          {/*<Image src={character?.image || 'https://placehold.co/400x400/F5EDED/3E3636?text=Stroke+Order'} fill alt={`Stroke order for ${character?.kana}`} className="mt-6 rounded-lg w-full max-w-xs aspect-square" />*/}
        </div>
        {/* Practice Canvas */}
        <div className="flex flex-col">
          <canvas
            ref={canvasRef}
            width="400"
            height="400"
            className="bg-white rounded-2xl border-2 border-dashed border-[#1F150C]/20 touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ maxWidth: '400px', maxHeight: '400px' }}
          />
          <div className="flex gap-2">
            <button onClick={() => console.log('true')} className="mt-4 p-3 rounded-full bg-white hover:bg-[#412D15] text-[#1F150C] hover:text-white transition-all duration-300 self-start"><Volume2 className="h-8 w-8" /></button>
            <button onClick={clearCanvas} className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#1F150C] text-white font-bold rounded-xl hover:bg-[#412D15] transition-colors">
              <Eraser className="h-5 w-5" /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Char;