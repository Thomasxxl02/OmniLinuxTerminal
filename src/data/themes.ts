import { TerminalTheme } from '../types';

export const TERMINAL_THEMES: TerminalTheme[] = [
  {
    id: 'matrix',
    name: 'Matrix Cyber Green',
    bg: '#050B05',
    fg: '#22C55E',
    promptUser: '#4ADE80',
    promptHost: '#22C55E',
    promptPath: '#A7F3D0',
    selectionBg: 'rgba(34, 197, 94, 0.3)',
    cursorColor: '#22C55E',
    accent: '#10B981',
    cardBg: '#091509'
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu Terminal',
    bg: '#300A24',
    fg: '#FFFFFF',
    promptUser: '#87D700',
    promptHost: '#E95420',
    promptPath: '#50A14F',
    selectionBg: 'rgba(233, 84, 32, 0.4)',
    cursorColor: '#FFFFFF',
    accent: '#E95420',
    cardBg: '#420F32'
  },
  {
    id: 'dracula',
    name: 'Dracula',
    bg: '#282A36',
    fg: '#F8F8F2',
    promptUser: '#BD93F9',
    promptHost: '#FF79C6',
    promptPath: '#8BE9FD',
    selectionBg: '#44475A',
    cursorColor: '#FF79C6',
    accent: '#BD93F9',
    cardBg: '#343746'
  },
  {
    id: 'nord',
    name: 'Nord Frost',
    bg: '#2E3440',
    fg: '#ECEFF4',
    promptUser: '#88C0D0',
    promptHost: '#81A1C1',
    promptPath: '#A3BE8C',
    selectionBg: '#4C566A',
    cursorColor: '#88C0D0',
    accent: '#88C0D0',
    cardBg: '#3B4252'
  },
  {
    id: 'kali',
    name: 'Kali Cyber Blue',
    bg: '#0D1117',
    fg: '#00F0FF',
    promptUser: '#00F0FF',
    promptHost: '#7000FF',
    promptPath: '#39FF14',
    selectionBg: 'rgba(0, 240, 255, 0.3)',
    cursorColor: '#00F0FF',
    accent: '#00F0FF',
    cardBg: '#161B22'
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    bg: '#1E222A',
    fg: '#ABB2BF',
    promptUser: '#98C379',
    promptHost: '#E06C75',
    promptPath: '#61AFEF',
    selectionBg: '#3E4451',
    cursorColor: '#528BFF',
    accent: '#61AFEF',
    cardBg: '#282C34'
  },
  {
    id: 'amber-crt',
    name: 'Retro Amber CRT',
    bg: '#0F0900',
    fg: '#FFB000',
    promptUser: '#FFC000',
    promptHost: '#FF9000',
    promptPath: '#FFE080',
    selectionBg: 'rgba(255, 176, 0, 0.3)',
    cursorColor: '#FFB000',
    accent: '#FFB000',
    cardBg: '#1A1000'
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    bg: '#2D2A2E',
    fg: '#FCFCFA',
    promptUser: '#FF6188',
    promptHost: '#A9DC76',
    promptPath: '#78DCE8',
    selectionBg: '#403E41',
    cursorColor: '#FFD866',
    accent: '#FF6188',
    cardBg: '#3A373A'
  }
];

export const DEFAULT_THEME = TERMINAL_THEMES[0]; // Matrix Green or Ubuntu
