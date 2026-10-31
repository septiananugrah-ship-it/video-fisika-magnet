// Naskah narasi "Listrik yang Bergerak" — Fisika Umum: Magnet.
// Setiap adegan berisi baris narasi. Durasi baris dihitung otomatis dari jumlah
// suku kata (lihat timeline.ts) atau dari rekaman suara bila sudah ada,
// jadi cukup ubah teks di sini: visual, subtitle, dan musik ikut menyesuaikan.
//
// Aturan menulis teks narasi (dibaca mesin TTS):
//  - angka & simbol ditulis sebagai kata ("dua puluh meter per detik"),
//  - rumus ditulis sebagai kalimat; rumus rapi tampil di layar (komponen Formula).
// Angka sudah dicek di naskah/AUDIT.md (g = 10 m/s², ρ air = 1000 kg/m³, p_atm = 100 kPa, kecuali disebut lain).
//
// hl     : kata/frasa yang disorot pada subtitle
// pause  : jeda (detik) SETELAH baris dibacakan
// lead   : jeda (detik) sebelum baris pertama adegan
// tail   : jeda (detik) setelah baris terakhir adegan
// fixed  : durasi tetap (detik) untuk adegan tanpa narasi

export type Line = {
  text: string;
  /** Teks khusus TTS (opsional). Bila kosong, dibuat otomatis oleh src/tts.ts. */
  tts?: string;
  hl?: string[];
  pause?: number;
};

export type SceneScript = {
  id: string;
  chapter: string; // nomor bab di heading, "" untuk tanpa heading
  part?: 1 | 2 | 3; // 1 konsep, 2 magnet di dunia kimia & jembatan kuantum, 3 penerapan
  title: string;
  lines: Line[];
  lead?: number;
  tail?: number;
  fixed?: number;
  mood: 'mystery' | 'title' | 'wonder' | 'build' | 'tension' | 'bright' | 'resolve' | 'outro';
};

export const SCRIPT: SceneScript[] = [
  {
    "id": "hook",
    "chapter": "",
    "title": "Kompas, aurora, dan MRI",
    "mood": "mystery",
    "lead": 1.6,
    "tail": 1.2,
    "lines": [
      {
        "text": "Jarum kompas selalu menunjuk ke utara, di mana pun kita berdiri di Bumi.",
        "hl": [
          "menunjuk ke utara"
        ],
        "pause": 0.7
      },
      {
        "text": "Di langit kutub, tirai cahaya hijau dan merah menari: aurora.",
        "hl": [
          "aurora"
        ],
        "pause": 0.7
      },
      {
        "text": "Dan di rumah sakit, mesin MRI memotret bagian dalam tubuh tanpa satu sayatan pun.",
        "hl": [
          "tanpa satu sayatan"
        ],
        "pause": 0.8
      },
      {
        "text": "Ketiganya digerakkan oleh satu hal:",
        "pause": 0.4
      },
      {
        "text": "medan magnet.",
        "hl": [
          "medan magnet"
        ],
        "pause": 0.9
      },
      {
        "text": "Dan yang mengejutkan, magnet ternyata hanyalah listrik yang bergerak. Bahkan elektron dan inti atom pun adalah magnet kecil.",
        "hl": [
          "listrik yang bergerak"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "title",
    "chapter": "",
    "title": "Listrik yang Bergerak",
    "mood": "title",
    "fixed": 8,
    "lines": []
  },
  {
    "id": "roadmap",
    "chapter": "",
    "title": "Peta video",
    "mood": "wonder",
    "lead": 0.8,
    "tail": 1.4,
    "lines": [
      {
        "text": "Video ini membahas kemagnetan dalam tiga bagian.",
        "hl": [
          "kemagnetan"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian pertama, konsep: kutub dan medan magnet, arus menghasilkan medan, gaya Lorentz, gaya pada kawat, dan induksi elektromagnetik.",
        "hl": [
          "konsep"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian kedua, magnet di dunia kimia: spektrometer massa, momen magnet elektron dan spin, serta resonansi magnetik inti.",
        "hl": [
          "dunia kimia"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian ketiga, penerapan: motor listrik, generator, dan MRI.",
        "hl": [
          "penerapan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "poles",
    "chapter": "01",
    "title": "Kutub dan medan magnet",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Setiap magnet punya dua kutub, utara dan selatan. Kutub sejenis tolak-menolak, kutub berlawanan tarik-menarik.",
        "hl": [
          "dua kutub"
        ],
        "pause": 0.7
      },
      {
        "text": "Potong sebuah magnet batang menjadi dua, dan kita tidak mendapat kutub utara saja. Setiap potongan langsung punya utara dan selatan sendiri.",
        "hl": [
          "Setiap potongan"
        ],
        "pause": 0.7
      },
      {
        "text": "Serbuk besi di sekitar magnet menggambarkan garis medan magnet: keluar dari kutub utara dan masuk ke kutub selatan.",
        "hl": [
          "garis medan magnet"
        ],
        "pause": 0.7
      },
      {
        "text": "Bumi sendiri adalah magnet raksasa. Jarum kompas berbalik sejajar dengan medannya, sekitar lima puluh mikrotesla di permukaan.",
        "hl": [
          "magnet raksasa"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "oersted",
    "chapter": "02",
    "title": "Arus menghasilkan medan magnet",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Pada tahun delapan belas dua puluh, Hans Christian Ørsted melihat jarum kompas bergoyang saat kawat di dekatnya dialiri arus.",
        "hl": [
          "Ørsted"
        ],
        "pause": 0.7
      },
      {
        "text": "Arus listrik menghasilkan medan magnet. Garis medannya melingkari kawat.",
        "hl": [
          "melingkari kawat"
        ],
        "pause": 0.7
      },
      {
        "text": "Arahnya mengikuti kaidah tangan kanan: ibu jari searah arus, jari-jari yang menggenggam menunjukkan arah medan.",
        "hl": [
          "kaidah tangan kanan"
        ],
        "pause": 0.7
      },
      {
        "text": "Besarnya B sama dengan mu nol I per dua pi r. Arus sepuluh ampere menghasilkan dua puluh mikrotesla pada jarak sepuluh sentimeter, hampir setara medan Bumi.",
        "hl": [
          "dua puluh mikrotesla"
        ],
        "pause": 0.7
      },
      {
        "text": "Gulung kawat menjadi kumparan, dan medan dari setiap lilitan saling menguatkan. Kumparan berarus berperilaku persis seperti magnet batang: inilah elektromagnet.",
        "hl": [
          "elektromagnet"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "lorentz",
    "chapter": "03",
    "title": "Gaya Lorentz pada muatan bergerak",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Medan magnet tidak mendorong muatan yang diam. Ia hanya bekerja pada muatan yang bergerak.",
        "hl": [
          "muatan yang bergerak"
        ],
        "pause": 0.7
      },
      {
        "text": "Gayanya F sama dengan q v B, dan arahnya tegak lurus terhadap kecepatan sekaligus terhadap medan.",
        "hl": [
          "F sama dengan q v B"
        ],
        "pause": 0.7
      },
      {
        "text": "Karena gayanya selalu tegak lurus gerak, medan magnet tidak mengubah kelajuan, hanya membelokkan arah.",
        "hl": [
          "hanya membelokkan arah"
        ],
        "pause": 0.7
      },
      {
        "text": "Akibatnya muatan bergerak melingkar, dengan jari-jari r sama dengan m v per q B. Partikel yang lebih berat berbelok lebih lebar.",
        "hl": [
          "m v per q B"
        ],
        "pause": 0.7
      },
      {
        "text": "Muatan positif dan negatif berbelok ke arah yang berlawanan.",
        "hl": [
          "berlawanan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "wireforce",
    "chapter": "04",
    "title": "Gaya pada kawat berarus",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kawat berarus berisi banyak muatan bergerak, jadi kawat itu pun merasakan gaya di dalam medan magnet.",
        "hl": [
          "merasakan gaya"
        ],
        "pause": 0.7
      },
      {
        "text": "Besarnya F sama dengan B I L: medan kali arus kali panjang kawat.",
        "hl": [
          "B I L"
        ],
        "pause": 0.7
      },
      {
        "text": "Kawat sepanjang dua puluh sentimeter dengan arus lima ampere di medan nol koma satu tesla terdorong dengan gaya nol koma satu newton.",
        "hl": [
          "nol koma satu newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Dua kawat sejajar yang arusnya searah saling tarik-menarik, dan yang berlawanan arah saling tolak.",
        "hl": [
          "saling tarik-menarik"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "induction",
    "chapter": "05",
    "title": "Induksi elektromagnetik",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bila listrik bisa menghasilkan magnet, bisakah magnet menghasilkan listrik? Michael Faraday menjawabnya pada tahun delapan belas tiga puluh satu.",
        "hl": [
          "Michael Faraday"
        ],
        "pause": 0.7
      },
      {
        "text": "Dorong magnet masuk ke kumparan, dan jarum galvanometer menyimpang. Tarik keluar, jarumnya menyimpang ke arah sebaliknya.",
        "hl": [
          "menyimpang"
        ],
        "pause": 0.7
      },
      {
        "text": "Yang penting bukan magnetnya, melainkan perubahan fluks magnet yang menembus kumparan. Makin cepat berubah, makin besar tegangannya.",
        "hl": [
          "perubahan fluks magnet"
        ],
        "pause": 0.7
      },
      {
        "text": "Inilah hukum Faraday: tegangan induksi sama dengan minus N kali laju perubahan fluks.",
        "hl": [
          "hukum Faraday"
        ],
        "pause": 0.7
      },
      {
        "text": "Tanda minus adalah hukum Lenz: arus induksi selalu melawan perubahan yang menimbulkannya. Kalau tidak, energi akan muncul dari ketiadaan.",
        "hl": [
          "hukum Lenz"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "massspec",
    "chapter": "06",
    "title": "Spektrometer massa",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sekarang pakai gaya Lorentz untuk menimbang molekul.",
        "hl": [
          "menimbang molekul"
        ],
        "pause": 0.7
      },
      {
        "text": "Dalam spektrometer massa, molekul diionkan, dipercepat, lalu ditembakkan ke dalam medan magnet.",
        "hl": [
          "spektrometer massa"
        ],
        "pause": 0.7
      },
      {
        "text": "Jari-jari lintasannya sebanding dengan massa per muatan. Ion yang ringan berbelok tajam, ion yang berat berbelok lebar.",
        "hl": [
          "massa per muatan"
        ],
        "pause": 0.7
      },
      {
        "text": "Klorin alam berisi dua isotop, klor tiga puluh lima dan klor tiga puluh tujuh, dengan perbandingan sekitar tiga banding satu. Spektrometer memisahkannya menjadi dua puncak.",
        "hl": [
          "tiga banding satu"
        ],
        "pause": 0.7
      },
      {
        "text": "Dari pola puncak-puncak itu kimiawan menentukan massa molekul dan mengenali senyawa yang tidak diketahui.",
        "hl": [
          "massa molekul"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "spin",
    "chapter": "07",
    "title": "Elektron: magnet terkecil",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Arus yang melingkar menghasilkan medan magnet. Elektron yang mengorbit inti juga merupakan arus melingkar kecil.",
        "hl": [
          "arus melingkar kecil"
        ],
        "pause": 0.7
      },
      {
        "text": "Tetapi elektron punya sifat yang lebih aneh: ia sendiri adalah magnet kecil, dengan momen magnet sekitar satu magneton Bohr.",
        "hl": [
          "magneton Bohr"
        ],
        "pause": 0.7
      },
      {
        "text": "Sifat ini disebut spin. Saat diukur di dalam medan magnet, spin elektron hanya bisa menghadap ke salah satu dari dua arah: atas atau bawah.",
        "hl": [
          "hanya bisa"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada tahun sembilan belas dua puluh dua, Stern dan Gerlach menembakkan berkas atom perak melewati medan magnet tak seragam. Berkas itu terbelah menjadi tepat dua, bukan menyebar.",
        "hl": [
          "terbelah menjadi tepat dua"
        ],
        "pause": 0.7
      },
      {
        "text": "Spin inilah yang membuat setiap orbital hanya bisa diisi dua elektron berpasangan, dan inilah asal sifat magnet bahan seperti besi.",
        "hl": [
          "dua elektron berpasangan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "nmr",
    "chapter": "08",
    "title": "Resonansi magnetik inti",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Inti atom hidrogen, yaitu proton, juga punya spin dan berperilaku seperti magnet kecil.",
        "hl": [
          "proton"
        ],
        "pause": 0.7
      },
      {
        "text": "Di dalam medan magnet kuat, spin proton terbagi menjadi dua tingkat energi: searah medan sedikit lebih rendah, berlawanan sedikit lebih tinggi.",
        "hl": [
          "dua tingkat energi"
        ],
        "pause": 0.7
      },
      {
        "text": "Gelombang radio dengan frekuensi yang pas membalik spin itu. Pada medan sembilan koma empat tesla, frekuensi resonansinya sekitar empat ratus megahertz.",
        "hl": [
          "empat ratus megahertz"
        ],
        "pause": 0.7
      },
      {
        "text": "Elektron di sekitar inti sedikit melindunginya dari medan luar, jadi proton di lingkungan kimia berbeda beresonansi pada frekuensi yang sedikit berbeda.",
        "hl": [
          "lingkungan kimia berbeda"
        ],
        "pause": 0.7
      },
      {
        "text": "Pergeseran kecil inilah yang dibaca kimiawan dalam spektrum NMR untuk mengetahui di mana setiap atom hidrogen berada dalam molekul.",
        "hl": [
          "spektrum NMR"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "motor",
    "chapter": "09",
    "title": "Motor listrik",
    "mood": "build",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Letakkan kumparan berarus di antara kutub magnet. Satu sisi kumparan didorong ke atas, sisi lainnya ke bawah: kumparan berputar.",
        "hl": [
          "kumparan berputar"
        ],
        "pause": 0.7
      },
      {
        "text": "Setiap setengah putaran, komutator membalik arah arus, sehingga putarannya terus searah.",
        "hl": [
          "komutator"
        ],
        "pause": 0.7
      },
      {
        "text": "Dari kipas angin, mesin cuci, sampai mobil listrik, motor mengubah energi listrik menjadi gerak lewat gaya pada kawat berarus.",
        "hl": [
          "energi listrik menjadi gerak"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "generator",
    "chapter": "10",
    "title": "Generator",
    "mood": "build",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Generator adalah motor yang dibalik. Putar kumparan di dalam medan magnet, dan fluks yang menembusnya terus berubah.",
        "hl": [
          "motor yang dibalik"
        ],
        "pause": 0.7
      },
      {
        "text": "Perubahan fluks itu menghasilkan tegangan bolak-balik yang naik-turun seperti gelombang sinus.",
        "hl": [
          "tegangan bolak-balik"
        ],
        "pause": 0.7
      },
      {
        "text": "Di Indonesia, listrik PLN berfrekuensi lima puluh hertz: tegangannya berbalik arah bolak-balik lima puluh kali setiap detik.",
        "hl": [
          "lima puluh hertz"
        ],
        "pause": 0.7
      },
      {
        "text": "Uap, air terjun, atau angin hanya bertugas memutar generator. Hukum Faraday yang mengubah putaran itu menjadi listrik.",
        "hl": [
          "Hukum Faraday"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "mri",
    "chapter": "11",
    "title": "MRI: NMR untuk tubuh",
    "mood": "wonder",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "MRI adalah resonansi magnetik inti yang diterapkan pada tubuh manusia.",
        "hl": [
          "resonansi magnetik inti"
        ],
        "pause": 0.7
      },
      {
        "text": "Tubuh kita sebagian besar air, dan setiap molekul air membawa dua proton.",
        "hl": [
          "dua proton"
        ],
        "pause": 0.7
      },
      {
        "text": "Magnet superkonduktor berkekuatan satu koma lima sampai tiga tesla, puluhan ribu kali medan Bumi, menyelaraskan spin proton itu. Pada satu koma lima tesla, frekuensi resonansinya sekitar enam puluh empat megahertz.",
        "hl": [
          "enam puluh empat megahertz"
        ],
        "pause": 0.7
      },
      {
        "text": "Kumparan gradien membuat medannya sedikit berbeda di setiap titik, sehingga setiap titik tubuh beresonansi pada frekuensinya sendiri. Dari sinyal itulah gambar disusun, tanpa radiasi pengion.",
        "hl": [
          "tanpa radiasi pengion"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "recap",
    "chapter": "12",
    "title": "Rangkuman",
    "mood": "resolve",
    "lead": 1.0,
    "tail": 1.6,
    "lines": [
      {
        "text": "Mari rangkum.",
        "pause": 0.5
      },
      {
        "text": "Magnet selalu punya dua kutub, dan medannya keluar dari utara masuk ke selatan.",
        "hl": [
          "dua kutub"
        ],
        "pause": 0.7
      },
      {
        "text": "Arus menghasilkan medan magnet, dan medan magnet mendorong muatan bergerak dengan gaya Lorentz yang tegak lurus geraknya.",
        "hl": [
          "gaya Lorentz"
        ],
        "pause": 0.7
      },
      {
        "text": "Perubahan fluks magnet menghasilkan tegangan induksi: hukum Faraday dan hukum Lenz.",
        "hl": [
          "perubahan fluks magnet"
        ],
        "pause": 0.7
      },
      {
        "text": "Di dunia kimia, gaya Lorentz menimbang molekul, spin elektron mengatur pengisian orbital, dan spin proton menjadi dasar NMR dan MRI.",
        "hl": [
          "spin"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi, setiap kali melihat magnet, tanyakan: muatan apa yang sedang bergerak, dan bagaimana fluksnya berubah?",
        "hl": [
          "muatan apa yang sedang bergerak"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "outro",
    "chapter": "",
    "title": "Penutup",
    "mood": "outro",
    "fixed": 16,
    "lines": []
  }
];
