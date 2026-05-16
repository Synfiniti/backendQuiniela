// Datos completos de los grupos con códigos de país
export const groupsData = {
  A: [
    { name: 'México', code: 'MX' },
    { name: 'Sudáfrica', code: 'ZA' },
    { name: 'Corea del Sur', code: 'KR' },
    { name: 'República Checa', code: 'CZ' }
  ],
  B: [
    { name: 'Canadá', code: 'CA' },
    { name: 'Bosnia y Herzegovina', code: 'BA' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Suiza', code: 'CH' }
  ],
  C: [
    { name: 'Brasil', code: 'BR' },
    { name: 'Marruecos', code: 'MA' },
    { name: 'Haití', code: 'HT' },
    { name: 'Escocia', code: 'GB-SCT' }
  ],
  D: [
    { name: 'Estados Unidos', code: 'US' },
    { name: 'Paraguay', code: 'PY' },
    { name: 'Australia', code: 'AU' },
    { name: 'Turquía', code: 'TR' }
  ],
  E: [
    { name: 'Alemania', code: 'DE' },
    { name: 'Curazao', code: 'CW' },
    { name: 'Costa de Marfil', code: 'CI' },
    { name: 'Ecuador', code: 'EC' }
  ],
  F: [
    { name: 'Países Bajos', code: 'NL' },
    { name: 'Japón', code: 'JP' },
    { name: 'Suecia', code: 'SE' },
    { name: 'Túnez', code: 'TN' }
  ],
  G: [
    { name: 'Bélgica', code: 'BE' },
    { name: 'Egipto', code: 'EG' },
    { name: 'Irán', code: 'IR' },
    { name: 'Nueva Zelanda', code: 'NZ' }
  ],
  H: [
    { name: 'España', code: 'ES' },
    { name: 'Cabo Verde', code: 'CV' },
    { name: 'Arabia Saudita', code: 'SA' },
    { name: 'Uruguay', code: 'UY' }
  ],
  I: [
    { name: 'Francia', code: 'FR' },
    { name: 'Senegal', code: 'SN' },
    { name: 'Irak', code: 'IQ' },
    { name: 'Noruega', code: 'NO' }
  ],
  J: [
    { name: 'Argentina', code: 'AR' },
    { name: 'Argelia', code: 'DZ' },
    { name: 'Austria', code: 'AT' },
    { name: 'Jordania', code: 'JO' }
  ],
  K: [
    { name: 'Portugal', code: 'PT' },
    { name: 'RD Congo', code: 'CD' },
    { name: 'Uzbekistán', code: 'UZ' },
    { name: 'Colombia', code: 'CO' }
  ],
  L: [
    { name: 'Inglaterra', code: 'GB-ENG' },
    { name: 'Croacia', code: 'HR' },
    { name: 'Ghana', code: 'GH' },
    { name: 'Panamá', code: 'PA' }
  ]
};

// Partidos destacados: solo 1 por ronda
export const featuredMatches = [
  { team1: 'Estados Unidos', team2: 'Paraguay' },     // Ronda 1 - 12 junio
  { team1: 'Argentina', team2: 'Austria' },            // Ronda 2 - 22 junio
  { team1: 'Colombia', team2: 'Portugal' },            // Ronda 3 - 27 junio
];

// Todos los partidos con fechas y horas
export const allMatches = [
  // Jueves 11 de junio 2026
  { group: 'A', team1: 'México', team2: 'Sudáfrica', date: '2026-06-11 14:00:00', matchday: 1 },
  { group: 'A', team1: 'Corea del Sur', team2: 'República Checa', date: '2026-06-11 21:00:00', matchday: 1 },
  
  // Viernes 12 de junio 2026
  { group: 'B', team1: 'Canadá', team2: 'Bosnia y Herzegovina', date: '2026-06-12 14:00:00', matchday: 1 },
  { group: 'D', team1: 'Estados Unidos', team2: 'Paraguay', date: '2026-06-12 20:00:00', matchday: 1 },
  { group: 'D', team1: 'Australia', team2: 'Turquía', date: '2026-06-12 23:00:00', matchday: 1 },
  
  // Sábado 13 de junio 2026
  { group: 'B', team1: 'Qatar', team2: 'Suiza', date: '2026-06-13 14:00:00', matchday: 1 },
  { group: 'C', team1: 'Brasil', team2: 'Marruecos', date: '2026-06-13 17:00:00', matchday: 1 },
  { group: 'C', team1: 'Haití', team2: 'Escocia', date: '2026-06-13 20:00:00', matchday: 1 },
  
  // Domingo 14 de junio 2026
  { group: 'E', team1: 'Alemania', team2: 'Curazao', date: '2026-06-14 12:00:00', matchday: 1 },
  { group: 'F', team1: 'Países Bajos', team2: 'Japón', date: '2026-06-14 15:00:00', matchday: 1 },
  { group: 'E', team1: 'Costa de Marfil', team2: 'Ecuador', date: '2026-06-14 18:00:00', matchday: 1 },
  { group: 'F', team1: 'Suecia', team2: 'Túnez', date: '2026-06-14 21:00:00', matchday: 1 },
  
  // Lunes 15 de junio 2026
  { group: 'H', team1: 'España', team2: 'Cabo Verde', date: '2026-06-15 11:00:00', matchday: 1 },
  { group: 'G', team1: 'Bélgica', team2: 'Egipto', date: '2026-06-15 14:00:00', matchday: 1 },
  { group: 'H', team1: 'Arabia Saudita', team2: 'Uruguay', date: '2026-06-15 17:00:00', matchday: 1 },
  { group: 'G', team1: 'Irán', team2: 'Nueva Zelanda', date: '2026-06-15 20:00:00', matchday: 1 },
  { group: 'J', team1: 'Austria', team2: 'Jordania', date: '2026-06-15 23:00:00', matchday: 1 },
  
  // Martes 16 de junio 2026
  { group: 'I', team1: 'Francia', team2: 'Senegal', date: '2026-06-16 14:00:00', matchday: 1 },
  { group: 'I', team1: 'Irak', team2: 'Noruega', date: '2026-06-16 17:00:00', matchday: 1 },
  { group: 'J', team1: 'Argentina', team2: 'Argelia', date: '2026-06-16 20:00:00', matchday: 1 },
  
  // Miércoles 17 de junio 2026
  { group: 'K', team1: 'Portugal', team2: 'RD Congo', date: '2026-06-17 12:00:00', matchday: 1 },
  { group: 'L', team1: 'Inglaterra', team2: 'Croacia', date: '2026-06-17 15:00:00', matchday: 1 },
  { group: 'L', team1: 'Ghana', team2: 'Panamá', date: '2026-06-17 18:00:00', matchday: 1 },
  { group: 'K', team1: 'Uzbekistán', team2: 'Colombia', date: '2026-06-17 21:00:00', matchday: 1 },
  
  // Jueves 18 de junio 2026 (Fecha 2)
  { group: 'A', team1: 'República Checa', team2: 'Sudáfrica', date: '2026-06-18 11:00:00', matchday: 2 },
  { group: 'B', team1: 'Suiza', team2: 'Bosnia y Herzegovina', date: '2026-06-18 14:00:00', matchday: 2 },
  { group: 'B', team1: 'Canadá', team2: 'Qatar', date: '2026-06-18 17:00:00', matchday: 2 },
  { group: 'A', team1: 'México', team2: 'Corea del Sur', date: '2026-06-18 20:00:00', matchday: 2 },
  { group: 'D', team1: 'Turquía', team2: 'Paraguay', date: '2026-06-18 23:00:00', matchday: 2 },
  
  // Viernes 19 de junio 2026
  { group: 'D', team1: 'Estados Unidos', team2: 'Australia', date: '2026-06-19 14:00:00', matchday: 2 },
  { group: 'C', team1: 'Escocia', team2: 'Marruecos', date: '2026-06-19 17:00:00', matchday: 2 },
  { group: 'C', team1: 'Brasil', team2: 'Haití', date: '2026-06-19 20:00:00', matchday: 2 },
  { group: 'F', team1: 'Túnez', team2: 'Japón', date: '2026-06-19 23:00:00', matchday: 2 },
  
  // Sábado 20 de junio 2026
  { group: 'F', team1: 'Países Bajos', team2: 'Suecia', date: '2026-06-20 12:00:00', matchday: 2 },
  { group: 'E', team1: 'Alemania', team2: 'Costa de Marfil', date: '2026-06-20 15:00:00', matchday: 2 },
  { group: 'E', team1: 'Ecuador', team2: 'Curazao', date: '2026-06-20 19:00:00', matchday: 2 },
  
  // Domingo 21 de junio 2026
  { group: 'H', team1: 'España', team2: 'Arabia Saudita', date: '2026-06-21 11:00:00', matchday: 2 },
  { group: 'G', team1: 'Bélgica', team2: 'Irán', date: '2026-06-21 14:00:00', matchday: 2 },
  { group: 'H', team1: 'Uruguay', team2: 'Cabo Verde', date: '2026-06-21 17:00:00', matchday: 2 },
  { group: 'G', team1: 'Nueva Zelanda', team2: 'Egipto', date: '2026-06-21 20:00:00', matchday: 2 },
  
  // Lunes 22 de junio 2026
  { group: 'J', team1: 'Argentina', team2: 'Austria', date: '2026-06-22 12:00:00', matchday: 2 },
  { group: 'I', team1: 'Francia', team2: 'Irak', date: '2026-06-22 16:00:00', matchday: 2 },
  { group: 'I', team1: 'Noruega', team2: 'Senegal', date: '2026-06-22 19:00:00', matchday: 2 },
  { group: 'J', team1: 'Jordania', team2: 'Argelia', date: '2026-06-22 22:00:00', matchday: 2 },
  
  // Martes 23 de junio 2026
  { group: 'K', team1: 'Portugal', team2: 'Uzbekistán', date: '2026-06-23 12:00:00', matchday: 2 },
  { group: 'L', team1: 'Inglaterra', team2: 'Ghana', date: '2026-06-23 15:00:00', matchday: 2 },
  { group: 'L', team1: 'Panamá', team2: 'Croacia', date: '2026-06-23 18:00:00', matchday: 2 },
  { group: 'K', team1: 'Colombia', team2: 'RD Congo', date: '2026-06-23 21:00:00', matchday: 2 },
  
  // Miércoles 24 de junio 2026 (Fecha 3)
  { group: 'B', team1: 'Suiza', team2: 'Canadá', date: '2026-06-24 14:00:00', matchday: 3 },
  { group: 'B', team1: 'Bosnia y Herzegovina', team2: 'Qatar', date: '2026-06-24 14:00:00', matchday: 3 },
  { group: 'C', team1: 'Brasil', team2: 'Escocia', date: '2026-06-24 17:00:00', matchday: 3 },
  { group: 'C', team1: 'Marruecos', team2: 'Haití', date: '2026-06-24 17:00:00', matchday: 3 },
  { group: 'A', team1: 'República Checa', team2: 'México', date: '2026-06-24 20:00:00', matchday: 3 },
  { group: 'A', team1: 'Sudáfrica', team2: 'Corea del Sur', date: '2026-06-24 20:00:00', matchday: 3 },
  
  // Jueves 25 de junio 2026
  { group: 'E', team1: 'Curazao', team2: 'Costa de Marfil', date: '2026-06-25 15:00:00', matchday: 3 },
  { group: 'E', team1: 'Ecuador', team2: 'Alemania', date: '2026-06-25 15:00:00', matchday: 3 },
  { group: 'F', team1: 'Japón', team2: 'Suecia', date: '2026-06-25 18:00:00', matchday: 3 },
  { group: 'F', team1: 'Túnez', team2: 'Países Bajos', date: '2026-06-25 18:00:00', matchday: 3 },
  { group: 'D', team1: 'Turquía', team2: 'Estados Unidos', date: '2026-06-25 21:00:00', matchday: 3 },
  { group: 'D', team1: 'Paraguay', team2: 'Australia', date: '2026-06-25 21:00:00', matchday: 3 },
  
  // Viernes 26 de junio 2026
  { group: 'I', team1: 'Noruega', team2: 'Francia', date: '2026-06-26 14:00:00', matchday: 3 },
  { group: 'I', team1: 'Senegal', team2: 'Irak', date: '2026-06-26 14:00:00', matchday: 3 },
  { group: 'H', team1: 'Cabo Verde', team2: 'Arabia Saudita', date: '2026-06-26 19:00:00', matchday: 3 },
  { group: 'H', team1: 'Uruguay', team2: 'España', date: '2026-06-26 19:00:00', matchday: 3 },
  { group: 'G', team1: 'Egipto', team2: 'Irán', date: '2026-06-26 22:00:00', matchday: 3 },
  { group: 'G', team1: 'Nueva Zelanda', team2: 'Bélgica', date: '2026-06-26 22:00:00', matchday: 3 },
  
  // Sábado 27 de junio 2026
  { group: 'L', team1: 'Panamá', team2: 'Inglaterra', date: '2026-06-27 16:00:00', matchday: 3 },
  { group: 'L', team1: 'Croacia', team2: 'Ghana', date: '2026-06-27 16:00:00', matchday: 3 },
  { group: 'K', team1: 'Colombia', team2: 'Portugal', date: '2026-06-27 18:30:00', matchday: 3 },
  { group: 'K', team1: 'RD Congo', team2: 'Uzbekistán', date: '2026-06-27 18:30:00', matchday: 3 },
  { group: 'J', team1: 'Argelia', team2: 'Austria', date: '2026-06-27 21:00:00', matchday: 3 },
  { group: 'J', team1: 'Jordania', team2: 'Argentina', date: '2026-06-27 21:00:00', matchday: 3 },
];

// Función helper para verificar si un partido es destacado
export const isFeaturedMatch = (team1, team2) => {
  return featuredMatches.some(
    fm => (fm.team1 === team1 && fm.team2 === team2) || 
          (fm.team1 === team2 && fm.team2 === team1)
  );
};