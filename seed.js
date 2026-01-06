const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const students = [
  {
    index_number: "30544201089",
    name: "Robert Mwai",
    school: "NGUMO SECONDARY SCHOOL",
    mean_grade: "C+ (PLUS)",
    grades: [
      { code: "121", name: "MATHEMATICS", grade: "C+ (PLUS)" },
      { code: "102", name: "KISWAHILI", grade: "C+ (PLUS)" },
      { code: "101", name: "ENGLISH", grade: "C+ (PLUS)" },
      { code: "233", name: "CHEMISTRY", grade: "C+ (PLUS)" },
      { code: "231", name: "BIOLOGY", grade: "B+ (PLUS)" },
      { code: "311", name: "HISTORY AND GOVERNMENT", grade: "C+ (PLUS)" },
      { code: "313", name: "CHRISTIAN RELIGIOUS EDUCATION", grade: "B" },
      { code: "443", name: "AGRICULTURE", grade: "B- (MINUS)" }
    ]
  },
  {
    index_number: "30544201047",
    name: "Moses Ndirangu",
    school: "NGUMO SECONDARY SCHOOL",
    mean_grade: "C+ (PLUS)",
    grades: [
      { code: "121", name: "MATHEMATICS", grade: "C+ (PLUS)" },
      { code: "102", name: "KISWAHILI", grade: "C+ (PLUS)" },
      { code: "101", name: "ENGLISH", grade: "C+ (PLUS)" },
      { code: "233", name: "CHEMISTRY", grade: "C+ (PLUS)" },
      { code: "231", name: "BIOLOGY", grade: "B (PLAIN)" },  // Twisted
      { code: "311", name: "HISTORY AND GOVERNMENT", grade: "C+ (PLUS)" },
      { code: "313", name: "CHRISTIAN RELIGIOUS EDUCATION", grade: "B" },
      { code: "443", name: "AGRICULTURE", grade: "B- (MINUS)" }
    ]
  },
  {
    index_number: "30556105028",
    name: "Maxwell Mbatia",
    school: "THIRU SECONDARY SCHOOL",
    mean_grade: "C+ (PLUS)",
    grades: [
      { code: "121", name: "MATHEMATICS", grade: "C+ (PLUS)" },
      { code: "102", name: "KISWAHILI", grade: "C+ (PLUS)" },
      { code: "101", name: "ENGLISH", grade: "C+ (PLUS)" },
      { code: "233", name: "CHEMISTRY", grade: "C+ (PLUS)" },
      { code: "231", name: "BIOLOGY", grade: "B+ (PLUS)" },
      { code: "311", name: "HISTORY AND GOVERNMENT", grade: "C+ (PLUS)" },
      { code: "313", name: "CHRISTIAN RELIGIOUS EDUCATION", grade: "B" },
      { code: "441", name: "HOME SCIENCE", grade: "B- (MINUS)" }
    ]
  },
  {
    index_number: "30556301335",
    name: "Gideon Kamau Ngugi",
    school: "NDURURUMO HIGH SCHOOL",
    mean_grade: "B+ (PLUS)",
    grades: [
      { code: "231", name: "BIOLOGY", grade: "A- (MINUS)" },
      { code: "311", name: "HISTORY AND GOVERNMENT", grade: "B+ (PLUS)" },
      { code: "313", name: "CHRISTIAN RELIGIOUS EDUCATION", grade: "B+ (PLUS)" },
      { code: "565", name: "BUSINESS STUDIES", grade: "B (PLAIN)" },
      { code: "121", name: "MATHEMATICS", grade: "B (PLAIN)" },
      { code: "101", name: "ENGLISH", grade: "B (PLAIN)" },
      { code: "102", name: "KISWAHILI", grade: "B- (MINUS)" },
      { code: "233", name: "CHEMISTRY", grade: "B- (MINUS)" }
    ]
  },
  {
    index_number: "30556121006",
    name: "Felix Ndegwa",
    school: "THIRU SECONDARY SCHOOL",
    mean_grade: "B (PLAIN)",
    grades: [
      { code: "231", name: "BIOLOGY", grade: "A- (MINUS)" },
      { code: "312", name: "GEOGRAPHY", grade: "B+ (PLUS)" },
      { code: "313", name: "CHRISTIAN RELIGIOUS EDUCATION", grade: "B+ (PLUS)" },
      { code: "451", name: "COMPUTER STUDIES", grade: "A (PLAIN)" },
      { code: "121", name: "MATHEMATICS", grade: "B (PLAIN)" },
      { code: "101", name: "ENGLISH", grade: "B (PLAIN)" },
      { code: "102", name: "KISWAHILI", grade: "B- (MINUS)" },
      { code: "233", name: "CHEMISTRY", grade: "B- (MINUS)" }
    ]
  }
];

db.serialize(() => {
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO students (index_number, name, school, mean_grade, grades) VALUES (?, ?, ?, ?, ?)`
  );

  students.forEach(s => {
    stmt.run(s.index_number, s.name, s.school, s.mean_grade, JSON.stringify(s.grades));
  });

  stmt.finalize();
});

db.close(() => console.log('Students added successfully!'));