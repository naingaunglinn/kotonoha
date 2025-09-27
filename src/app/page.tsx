'use client'
import React, {useEffect, useState} from 'react';
import {BasicModuleProps, LevelProps} from "@/types";
import HomeCard from "@/app/components/HomeCard";

// const levels = [{
//   [id]: 'n5',
//   title: 'JLPT N5',
//   description: 'The foundational lesson for basic Japanese understanding.',
//   icon: Award,
//   lesson: [{
//     [id]: 'n5-vocab',
//     title: 'Vocabulary',
//     description: 'Learn the first 800 essential words.',
//     icon: Book,
//     content: [{
//       word: '私',
//       reading: 'わたし',
//       meaning: 'I, me'
//     }, {
//       word: 'あなた',
//       reading: 'あなた',
//       meaning: 'you'
//     }, {
//       word: 'です',
//       reading: 'です',
//       meaning: 'is, am, are'
//     }, {
//       word: 'はい',
//       reading: 'はい',
//       meaning: 'yes'
//     }, {
//       word: 'いいえ',
//       reading: 'いいえ',
//       meaning: 'no'
//     }, {
//       word: '日本',
//       reading: 'にほん',
//       meaning: 'Japan'
//     }, {
//       word: '学生',
//       reading: 'がくせい',
//       meaning: 'student'
//     }, {
//       word: '先生',
//       reading: 'せんせい',
//       meaning: 'teacher'
//     }, ]
//   }, {
//     [id]: 'n5-kanji',
//     title: 'Kanji',
//     description: 'Master the first 100 kanji characters.',
//     icon: BrainCircuit,
//     content: [{
//       kanji: '一',
//       onyomi: 'イチ',
//       kunyomi: 'ひと',
//       meaning: 'one',
//       strokes: 1
//     }, {
//       kanji: '二',
//       onyomi: 'ニ',
//       kunyomi: 'ふた',
//       meaning: 'two',
//       strokes: 2
//     }, {
//       kanji: '三',
//       onyomi: 'サン',
//       kunyomi: 'み',
//       meaning: 'three',
//       strokes: 3
//     }, {
//       kanji: '日',
//       onyomi: 'ニチ',
//       kunyomi: 'ひ',
//       meaning: 'day, sun',
//       strokes: 4
//     }, {
//       kanji: '人',
//       onyomi: 'ジン',
//       kunyomi: 'ひと',
//       meaning: 'person',
//       strokes: 2
//     }, {
//       kanji: '年',
//       onyomi: 'ネン',
//       kunyomi: 'とし',
//       meaning: 'year',
//       strokes: 6
//     }, {
//       kanji: '大',
//       onyomi: 'ダイ',
//       kunyomi: 'おお',
//       meaning: 'big',
//       strokes: 3
//     }, {
//       kanji: '本',
//       onyomi: 'ホン',
//       kunyomi: 'もと',
//       meaning: 'book',
//       strokes: 5
//     }, ]
//   }, {
//     [id]: 'n5-grammar',
//     title: 'Grammar',
//     description: 'Basic sentence structures and particles.',
//     icon: List,
//     content: [{
//       title: 'A は B です (A is B)',
//       explanation: 'This is the most basic sentence structure. It equates A with B. は (wa) is the topic marker.',
//       examples: [{
//         japanese: '私は学生です。',
//         english: 'I am a student.'
//       }, {
//         japanese: 'これは本です。',
//         english: 'This is a book.'
//       }, ]
//     }, {
//       title: 'Particle の (Possessive)',
//       explanation: 'The particle の (no) is used to show possession, similar to "apostrophe s" in English.',
//       examples: [{
//         japanese: '私の名前はジョンです。',
//         english: 'My name is John.'
//       }, {
//         japanese: 'これは日本の車です。',
//         english: 'This is a Japanese car.'
//       }, ]
//     }]
//   }, {
//     [id]: 'n5-reading',
//     title: 'Reading',
//     description: 'Practice with simple passages.',
//     icon: BookOpen,
//     content: [{
//       title: 'First Reading Practice',
//       passage: 'こんにちは。私の名前は田中です。私は日本人です。学生です。どうぞよろしく。',
//       questions: [{
//         question: 'What is the person\'s name?',
//         options: ['Suzuki', 'Tanaka', 'Yamada'],
//         answer: 'Tanaka'
//       }, {
//         question: 'What is the person\'s occupation?',
//         options: ['Teacher', 'Doctor', 'Student'],
//         answer: 'Student'
//       }]
//     }]
//   }, {
//     [id]: 'n5-listening',
//     title: 'Listening',
//     description: 'Develop your ear for conversations.',
//     icon: Headphones,
//     content: [{
//       title: 'Basic Greetings',
//       audioSrc: '#', // Placeholder for audio file transcript: 'おはようございます。',
//       questions: [{
//         question: 'What did you hear?',
//         options: ['Good evening', 'Good morning', 'Goodbye'],
//         answer: 'Good morning'
//       }]
//     }]
//   }, ],
// }, {
//   [id]: 'n4',
//   title: 'JLPT N4',
//   description: 'Build upon your basics for everyday conversations.',
//   icon: Award,
//   lesson: []
// }, {
//   [id]: 'n3',
//   title: 'JLPT N3',
//   description: 'Bridge the gap to intermediate-lesson Japanese.',
//   icon: Award,
//   lesson: []
// }, {
//   [id]: 'n2',
//   title: 'JLPT N2',
//   description: 'Understand Japanese used in a broad range of situations.',
//   icon: Award,
//   lesson: []
// }, {
//   [id]: 'n1',
//   title: 'JLPT N1',
//   description: 'Aim for fluency and understand a wide range of topics.',
//   icon: Award,
//   lesson: []
// }, ];

// --- MAIN APP ---
export default function HomePage() {
  const [levels, setLevels] = useState<LevelProps[]>([])
  const [modules, setModules] = useState<BasicModuleProps[] | null>([])

  useEffect(() => {
    fetchLevels();
    fetchModules();
  }, [])

  async function fetchLevels() {
    try {
      // Fetch the local JSON file. The path is relative to the public directory.
      const response = await fetch('/data/lesson/level.json');

      // Throw an error if the network response is not ok (e.g., 404 Not Found)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the JSON data from the response
      const data = await response.json();

      // Set the data to your state
      console.log(data);
      setLevels(data);

    } catch (error) {
      // Catch and handle any errors during the fetch or parsing
      console.error("Failed to fetch local modules:", error);
    }
  }

  async function fetchModules() {
    try {
      // Fetch the local JSON file. The path is relative to the public directory.
      const response = await fetch('/data/character/module.json');

      // Throw an error if the network response is not ok (e.g., 404 Not Found)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the JSON data from the response
      const data = await response.json();

      // Set the data to your state
      console.log(data);
      setModules(data);

    } catch (error) {
      // Catch and handle any errors during the fetch or parsing
      console.error("Failed to fetch local modules:", error);
    }
  }


  return (
      <HomeCard
        levels={levels.length ? levels : []}
        modules={modules?.length ? modules : []}
      />
  );
}
