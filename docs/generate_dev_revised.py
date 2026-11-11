# -*- coding: utf-8 -*-
"""
Script Generator PDF dan DOCX Revisi Menyeluruh Bab IV Subbab 4.3 Development (AiDen)
Program Studi Rekayasa Perangkat Lunak - Universitas Bina Sarana Informatika (UBSI)
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
import pymupdf

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Halaman X dari Y',
    plus standard academic header and footer.
    """
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_decorations(self, num_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(3.0 * cm, 28.2 * cm, "BAB IV IMPLEMENTASI SISTEM — 4.3 DEVELOPMENT (AIDEN)")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(3.0 * cm, 28.0 * cm, 18.5 * cm, 28.0 * cm)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(3.0 * cm, 2.0 * cm, 18.5 * cm, 2.0 * cm)

        footer_text_left = "Program Studi Rekayasa Perangkat Lunak — Universitas Bina Sarana Informatika"
        page_str = f"Halaman {self._pageNumber} dari {num_pages}"
        self.drawString(3.0 * cm, 1.5 * cm, footer_text_left)
        self.drawRightString(18.5 * cm, 1.5 * cm, page_str)

        self.restoreState()


def create_code_table(code_text, start_line, col_widths=[32, 408]):
    """
    Generates a stylized table with code line numbers and syntax styling.
    Font size 8pt with comfortable leading for readability.
    """
    lines = code_text.strip("\n").split("\n")
    data = []
    
    num_style = ParagraphStyle(
        "LineNumStyle",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#64748b"),
        alignment=2 # Right align
    )
    
    code_line_style = ParagraphStyle(
        "CodeLineStyle",
        fontName="Courier",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a"),
        alignment=0 # Left align
    )

    for i, line in enumerate(lines):
        line_num = str(start_line + i)
        # Escape XML entities in code
        clean_line = (
            line.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace(" ", "&nbsp;")
        )
        data.append([
            Paragraph(line_num, num_style),
            Paragraph(clean_line, code_line_style)
        ])

    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('LINEBEFORE', (1, 0), (1, -1), 1, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 1.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
    ]))
    return table


def build_meta_box(file_path, line_range, title):
    meta_style = ParagraphStyle(
        "MetaBoxStyle",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )
    content = (
        f"<b>Nama File:</b> <font name='Courier'>{file_path}</font><br/>"
        f"<b>Lokasi Kode:</b> {line_range}<br/>"
        f"<b>Judul Potongan Kode:</b> {title}"
    )
    p = Paragraph(content, meta_style)
    t = Table([[p]], colWidths=[440])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#93c5fd")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def build_screenshot_box(fig_num, fig_title, desc_text, actual_image_path=None, action_note=None):
    caption_style = ParagraphStyle(
        "CaptionStyle",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        alignment=1 # Center
    )
    desc_style = ParagraphStyle(
        "DescStyle",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#334155"),
        alignment=4 # Justify
    )
    
    elements = []
    
    if actual_image_path and os.path.exists(actual_image_path):
        img = Image(actual_image_path, width=440, height=232)
        elements.append(img)
    else:
        box_style = ParagraphStyle(
            "PlaceholderBoxStyle",
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#0369a1"),
            alignment=1
        )
        
        box_content = (
            f"<b>[DOKUMENTASI HASIL IMPLEMENTASI ANTARMUKA: GAMBAR {fig_num}]</b><br/>"
            f"<font color='#0284c7'><b>Target Tampilan:</b> {fig_title}</font><br/><br/>"
            f"<font color='#475569'><b>Panduan Pengambilan Screenshot Mandiri:</b><br/>"
            f"{action_note if action_note else 'Jalankan server aplikasi (npm run dev), navigasikan ke rute terkait, dan tangkap layar panel fitur.'}</font>"
        )
        
        t = Table([[Paragraph(box_content, box_style)]], colWidths=[440], rowHeights=[75])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0f9ff")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#bae6fd")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t)

    caption = Paragraph(f"<b>Gambar {fig_num}.</b> {fig_title}", caption_style)
    desc = Paragraph(f"<i>Keterangan:</i> {desc_text}", desc_style)
    
    elements.extend([Spacer(1, 4), caption, Spacer(1, 3), desc])
    return elements


def generate_pdf(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        leftMargin=3.0 * cm,
        rightMargin=2.5 * cm,
        topMargin=2.8 * cm,
        bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ChapterTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        alignment=1, # Center
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        "SubSectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "SubSectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "AcademicBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        alignment=4, # Justify
        firstLineIndent=18,
        spaceAfter=6
    )

    body_no_indent = ParagraphStyle(
        "AcademicBodyNoIndent",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        alignment=4, # Justify
        spaceAfter=6
    )

    list_item_style = ParagraphStyle(
        "ListItemStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        alignment=4,
        leftIndent=15,
        spaceAfter=3
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    story = []

    # Title Banner
    story.append(Paragraph("BAB IV<br/>IMPLEMENTASI SISTEM", title_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceAfter=12))

    # 4.3 Development Intro
    story.append(Paragraph("4.3 Development", h1_style))
    story.append(Paragraph(
        "Tahap <i>Development</i> (Pengembangan) merupakan fase ketiga dalam metodologi ADDIE "
        "(<i>Analysis, Design, Development, Implementation, Evaluation</i>). Pada tahap ini, seluruh cetak biru, "
        "rancangan arsitektur basis data, diagram alir, dan desain antarmuka pengguna yang telah disusun pada tahap <i>Design</i> "
        "diterjemahkan secara sistematis menjadi kode program aplikasi AiDen (<i>AI Learning Assistant</i>). "
        "Fokus utama pengembangan adalah membangun sistem berbantuan kecerdasan artifisial yang mampu membantu mahasiswa "
        "memahami materi kuliah berbasis dokumen modul pembelajaran secara mandiri dan terstruktur.",
        body_style
    ))
    story.append(Paragraph(
        "Implementasi teknis aplikasi AiDen dibangun dengan memanfaatkan kerangka kerja <i>Next.js 16 App Router</i>, "
        "bahasa pemrograman <i>TypeScript</i>, pustaka <i>Vercel AI SDK</i> (@ai-sdk/google), serta basis data relasional "
        "<i>Supabase PostgreSQL</i> yang dilengkapi ekstensi <code>pgvector</code>. Melalui pendekatan <i>Retrieval-Augmented Generation</i> "
        "(RAG), sistem dirancang untuk membatasi ruang lingkup inferensi model bahasa besar (<i>Large Language Model</i>) "
        "agar selalu merujuk pada konteks materi dokumen modul yang diunggah pengguna. Hal ini bertujuan untuk meminimalkan timbulnya "
        "halusinasi informasi dan menjaga konsistensi jawaban sesuai dengan materi akademis yang dipelajari.",
        body_style
    ))

    story.append(Spacer(1, 6))

    # 4.3.1 Implementasi RAG
    story.append(Paragraph("4.3.1 Implementasi RAG (Retrieval-Augmented Generation)", h1_style))
    story.append(Paragraph(
        "Penerapan arsitektur <i>Retrieval-Augmented Generation</i> (RAG) pada AiDen menjadi fondasi penting "
        "dalam menghubungkan materi dokumen perkuliahan berformat PDF dengan kapabilitas penalaran model AI. "
        "Implementasi RAG berjalan secara sistematis melalui 8 (delapan) tahapan alur kerja:",
        body_style
    ))

    rag_steps = [
        "<b>1. Penerimaan dan Penyimpanan Dokumen PDF:</b> Dokumen modul diunggah oleh pengguna melalui dialog pembuatan workspace. File PDF disimpan pada Supabase Storage bucket <code>materials</code> dengan metadata dokumen dicatat ke tabel <code>documents</code>.",
        "<b>2. Ekstraksi Teks Mentah Dokumen:</b> Teks dokumen diekstraksi dari buffer biner PDF menggunakan pustaka <code>pdf-parse</code> pada fungsi <code>processDocument()</code> file <code>utils/rag/processor.ts</code>.",
        "<b>3. Pemecahan Teks Adaptif (Text Chunking):</b> Teks hasil ekstraksi dibagi menjadi potongan teks (<i>chunk</i>) berukuran 1.200 karakter dengan <i>overlap</i> 200 karakter, memperhatikan batas baris (<i>newline boundary</i>) agar konteks kalimat tidak terputus sembarangan.",
        "<b>4. Pembuatan Vektor Dense (Batched Embedding):</b> Setiap potongan teks dikonversi menjadi vektor embedding berdimensi 3.072 menggunakan model <code>gemini-embedding-001</code> secara berkelompok (<i>batch</i> 20 chunk) guna menjaga efisiensi pemanggilan API.",
        "<b>5. Penyimpanan Vektor dan Metadata:</b> Potongan teks beserta representasi vektor numeriknya disimpan ke dalam tabel <code>document_chunks</code> lengkap dengan nomor urutan chunk dan total pecahan materi.",
        "<b>6. Akselerasi Penelusuran HNSW:</b> Tabel <code>document_chunks</code> diindeks menggunakan algoritma <i>Hierarchical Navigable Small World</i> (HNSW) berbasis operator <code>vector_cosine_ops</code> untuk pencarian tetangga terdekat berkecepatan tinggi.",
        "<b>7. Pencarian Kemiripan Semantik (Semantic Search):</b> Kesamaan semantik dihitung melalui fungsi <i>Stored Procedure</i> PostgreSQL <code>match_document_chunks()</code> yang membandingkan <i>cosine similarity</i> antara embedding pertanyaan dan embedding dokumen.",
        "<b>8. Modul Terpadu RAG Retriever:</b> Modul <code>lib/ai/rag-retriever.ts</code> mengabstraksi fungsi penelusuran semantik (<code>retrieveRelevantChunks</code>) dan penarikan seluruh bab dokumen (<code>getAllWorkspaceChunks</code>) untuk digunakan pada seluruh fitur pembelajaran AiDen."
    ]
    for step in rag_steps:
        story.append(Paragraph(step, list_item_style))

    story.append(Spacer(1, 6))

    # Potongan Kode 1: Chunking
    story.append(build_meta_box(
        "utils/rag/processor.ts",
        "Baris 10–26",
        "Implementasi Pemecahan Teks Dokumen (Text Chunking)"
    ))
    code_chunking = (
        "function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {\n"
        "  const chunks: string[] = []\n"
        "  let i = 0\n"
        "  while (i < text.length) {\n"
        "    let end = i + chunkSize\n"
        "    if (end < text.length) {\n"
        "      const boundary = text.lastIndexOf(\"\\n\", end)\n"
        "      if (boundary > i + chunkSize - 100) end = boundary + 1\n"
        "    }\n"
        "    const chunk = text.slice(i, end).trim()\n"
        "    if (chunk.length > 0) chunks.push(chunk)\n"
        "    i = end - overlap\n"
        "    if (i <= 0) i = end\n"
        "  }\n"
        "  return chunks\n"
        "}"
    )
    story.append(create_code_table(code_chunking, 10))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi <code>chunkText()</code> membagi teks panjang dokumen menjadi fragmen berukuran 1.200 karakter "
        "dengan tumpang tindih (<i>overlap</i>) 200 karakter. Logika penyesuaian batas (<code>boundary</code>) memastikan pemotongan teks "
        "dilakukan pada tanda perpindahan baris (<i>newline</i>) terdekat dalam rentang 100 karakter terakhir, sehingga keutuhan paragraf atau kalimat tetap terjaga.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 2: Batched Embedding
    story.append(build_meta_box(
        "utils/rag/processor.ts",
        "Baris 74–88",
        "Implementasi Pembuatan Embedding Vektor Berkelompok (Batch Embedding)"
    ))
    code_embedding = (
        "const BATCH_SIZE = 20\n"
        "const allEmbeddings: number[][] = []\n"
        "\n"
        "for (let b = 0; b < chunks.length; b += BATCH_SIZE) {\n"
        "  const batch = chunks.slice(b, b + BATCH_SIZE)\n"
        "  const { embeddings } = await embedMany({\n"
        "    model: google.textEmbeddingModel(EMBEDDING_MODEL, {\n"
        "      outputDimensionality: EMBEDDING_DIMENSIONS,\n"
        "    }),\n"
        "    values: batch,\n"
        "  })\n"
        "  allEmbeddings.push(...embeddings)\n"
        "}"
    )
    story.append(create_code_table(code_embedding, 74))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Potongan kode di atas mengonversi seluruh potongan teks menjadi representasi vektor dense "
        "menggunakan model <code>gemini-embedding-001</code> dengan dimensi 3.072 melalui fungsi <code>embedMany()</code>. "
        "Pengelompokan (<i>batching</i>) sebesar 20 chunk per pemanggilan bertujuan untuk mematuhi batas <i>rate limit</i> API Google serta mengoptimalkan waktu proses jaringan.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 3: Penyimpanan Chunk
    story.append(build_meta_box(
        "utils/rag/processor.ts",
        "Baris 92–109",
        "Penyimpanan Potongan Teks dan Vektor ke Tabel Basis Data"
    ))
    code_storage = (
        "const chunkRecords = chunks.map((chunk, index) => ({\n"
        "  document_id: documentId,\n"
        "  workspace_id: workspaceId,\n"
        "  content: chunk,\n"
        "  embedding: allEmbeddings[index],\n"
        "  metadata: {\n"
        "    chunk_index: index,\n"
        "    total_chunks: chunks.length,\n"
        "    embedding_model: EMBEDDING_MODEL,\n"
        "    embedding_dims: EMBEDDING_DIMENSIONS,\n"
        "  },\n"
        "}))\n"
        "\n"
        "const { error: insertError } = await supabase\n"
        "  .from(\"document_chunks\")\n"
        "  .insert(chunkRecords)"
    )
    story.append(create_code_table(code_storage, 92))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Potongan kode ini menyusun objek rekaman data untuk setiap chunk teks beserta vektor embedding dan metadatanya "
        "(seperti urutan nomor chunk dan model embedding yang digunakan). Data tersebut kemudian disimpan secara massal ke dalam tabel <code>document_chunks</code> di Supabase PostgreSQL.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 4: RPC match_document_chunks
    story.append(build_meta_box(
        "rag-migration.sql",
        "Baris 128–144",
        "Fungsi PostgreSQL RPC match_document_chunks untuk Pencarian Kesamaan Semantik"
    ))
    code_rpc = (
        "SELECT\n"
        "  dc.id, dc.document_id, dc.content, dc.metadata,\n"
        "  1 - (dc.embedding <=> query_embedding) AS similarity\n"
        "FROM document_chunks dc\n"
        "JOIN documents d ON d.id = dc.document_id\n"
        "WHERE\n"
        "  (filter_workspace_id IS NULL OR dc.workspace_id = filter_workspace_id)\n"
        "  AND (filter_user_id IS NULL OR d.user_id = filter_user_id)\n"
        "  AND d.status = 'completed'\n"
        "ORDER BY dc.embedding <=> query_embedding\n"
        "LIMIT match_count;"
    )
    story.append(create_code_table(code_rpc, 128))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi RPC ini memanfaatkan operator jarak kosinus (<code>&lt;=&gt;</code>) dari ekstensi <code>pgvector</code> "
        "untuk menghitung nilai kemiripan semantik (<i>cosine similarity</i> = <code>1 - distance</code>). Kueri secara ketat membatasi pencarian "
        "berdasarkan <code>filter_workspace_id</code>, kepemilikan <code>user_id</code>, dan hanya memproses dokumen dengan status <code>'completed'</code>.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 5: retrieveRelevantChunks
    story.append(build_meta_box(
        "lib/ai/rag-retriever.ts",
        "Baris 31–49",
        "Pengambilan Potongan Dokumen Relevan Melalui Modul RAG Retriever"
    ))
    code_retriever = (
        "const { embedding } = await embed({\n"
        "  model: google.textEmbeddingModel(EMBEDDING_MODEL, {\n"
        "    outputDimensionality: EMBEDDING_DIMENSIONS,\n"
        "  }),\n"
        "  value: query,\n"
        "})\n"
        "\n"
        "const { data: chunks, error: matchError } = await supabase.rpc(\n"
        "  \"match_document_chunks\",\n"
        "  {\n"
        "    query_embedding: embedding,\n"
        "    match_count: matchCount,\n"
        "    filter_workspace_id: workspaceId,\n"
        "    filter_user_id: userId || null,\n"
        "  }\n"
        ")"
    )
    story.append(create_code_table(code_retriever, 31))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi <code>retrieveRelevantChunks()</code> menerima teks kueri pertanyaan pengguna, "
        "mengonversinya menjadi vektor embedding kueri berdimensi 3.072 secara <i>real-time</i>, lalu memanggil fungsi RPC "
        "<code>match_document_chunks</code> untuk mengambil sejumlah fragmen dokumen yang memiliki kemiripan semantik tertinggi.",
        body_no_indent
    ))

    story.append(Spacer(1, 10))

    # 4.3.2 Implementasi Fitur Tanya Jawab
    story.append(Paragraph("4.3.2 Implementasi Fitur Tanya Jawab dan Rujukan Sumber", h1_style))
    story.append(Paragraph(
        "Fitur Tanya Jawab (<i>AI Chat</i>) diimplementasikan pada antarmuka <code>components/features/ai-chat/AIChatPanel.tsx</code> "
        "dan API route <code>app/api/chat/route.ts</code>. Fitur ini memungkinkan pengguna mengajukan pertanyaan seputar materi modul, "
        "di mana sistem akan mencari cuplikan materi yang relevan dan menyajikannya bersama rujukan sumber. Alur kerja fitur ini mencakup:",
        body_style
    ))

    chat_steps = [
        "<b>1. Pengiriman Pertanyaan Pengguna:</b> Pengguna menginput pertanyaan melalui formulir percakapan. State pesan dikelola menggunakan hook <code>useChat()</code> pada sisi klien.",
        "<b>2. Penelusuran Semantik Konteks RAG:</b> Server mengekstrak teks pertanyaan pengguna terakhir dan memanggil <code>retrieveRelevantChunks()</code> untuk menarik hingga 5 potongan materi paling relevan.",
        "<b>3. Penyusunan Prompt Teraugmentasi:</b> Konteks dokumen yang ditemukan digabungkan dan diinjeksikan ke dalam <i>System Prompt</i> dengan instruksi ketat agar model menjawab hanya berdasarkan fakta teks tersebut.",
        "<b>4. Generasi Jawaban Streaming:</b> Model AI (<code>gemini-2.5-flash</code>) memproses jawaban dengan mekanisme <i>streaming</i> kata demi kata (<code>smoothStream</code>) untuk memberikan respons interaktif yang cepat.",
        "<b>5. Penyajian Rujukan Sumber:</b> Jawaban yang disajikan kepada pengguna menyertakan nomor bagian atau halaman materi modul pembelajaran sebagai rujukan akademis."
    ]
    for s in chat_steps:
        story.append(Paragraph(s, list_item_style))

    story.append(Spacer(1, 6))

    # Potongan Kode 6: Chat Retrieval
    story.append(build_meta_box(
        "app/api/chat/route.ts",
        "Baris 53–67",
        "Pengambilan Pertanyaan Pengguna dan Retrieval Potongan Dokumen"
    ))
    code_chat_retrieval = (
        "const lastMessage = messages[messages.length - 1]\n"
        "let contextText = \"\"\n"
        "\n"
        "if (lastMessage?.role === \"user\" && lastMessage.content) {\n"
        "  const chunks = await retrieveRelevantChunks(supabase, {\n"
        "    workspaceId,\n"
        "    userId: user.id,\n"
        "    query: lastMessage.content,\n"
        "    matchCount: 5,\n"
        "  })\n"
        "\n"
        "  if (chunks && chunks.length > 0) {\n"
        "    contextText = chunks.map(c => c.content).join(\"\\n\\n---\\n\\n\")\n"
        "  }\n"
        "}"
    )
    story.append(create_code_table(code_chat_retrieval, 53))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Server API memeriksa pesan terakhir yang dikirim oleh pengguna. Jika bertipe 'user', kueri pertanyaan "
        "diteruskan ke fungsi <code>retrieveRelevantChunks()</code> untuk mengambil 5 potongan teks dokumen yang paling relevan. "
        "Fragmen teks tersebut kemudian digabungkan dengan pemisah garis horizontal ke dalam variabel <code>contextText</code>.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 7: Chat Prompt Injection
    story.append(build_meta_box(
        "app/api/chat/route.ts",
        "Baris 78–89",
        "Penyusunan Konteks Dokumen Hasil Retrieval ke dalam System Prompt"
    ))
    code_chat_prompt = (
        "let systemContent = buildSystemPrompt()\n"
        "if (contextText) {\n"
        "  systemContent +=\n"
        "    `\\n\\n[KONTEKS DARI DOKUMEN — HASIL RETRIEVAL]\\n` +\n"
        "    `Berikut adalah cuplikan materi yang paling relevan dengan pertanyaan user:\\n\\n` +\n"
        "    `${contextText}\\n\\n` +\n"
        "    `Aturan ketat:\\n` +\n"
        "    `- Jawab HANYA berdasarkan konteks di atas.\\n` +\n"
        "    `- Jika informasi tidak ada di konteks, katakan dengan jujur: \"hmm info ini kayanya ga ada di dokumen yang lu kasih ke gue 🤔\"\\n` +\n"
        "    `- Jangan mengarang atau menambah info dari luar dokumen.`\n"
        "}"
    )
    story.append(create_code_table(code_chat_prompt, 78))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Variabel <code>contextText</code> disisipkan ke dalam <code>systemContent</code>. "
        "Instruksi ketat diberikan kepada model AI agar membatasi jawaban hanya pada teks hasil retrieval dan secara eksplisit "
        "mengakui apabila informasi yang ditanyakan tidak ditemukan pada dokumen, sehingga mencegah terjadinya fabrikasi jawaban.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 8: Chat Streaming
    story.append(build_meta_box(
        "app/api/chat/route.ts",
        "Baris 96–104",
        "Eksekusi Generasi Respons Streaming Menggunakan Model AI"
    ))
    code_chat_stream = (
        "const result = streamText({\n"
        "  model: google(CHAT_MODEL),\n"
        "  system: systemContent,\n"
        "  messages: aiMessages as any,\n"
        "  temperature: 0.7,\n"
        "  experimental_transform: smoothStream({ delayInMs: 40, chunking: \"word\" }),\n"
        "})\n"
        "\n"
        "return result.toDataStreamResponse()"
    )
    story.append(create_code_table(code_chat_stream, 96))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi <code>streamText()</code> dari Vercel AI SDK mengeksekusi inferensi model bahasa "
        "secara <i>streaming</i>. Transformasi <code>smoothStream()</code> memberikan efek pengetikan alami bertahap per kata "
        "dengan jeda 40 milidetik, lalu mengembalikan aliran data respons HTTP ke komponen antarmuka pengguna.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot AI Chat (Actual ss.png is workspace chat view)
    for flow in build_screenshot_box(
        "IV.1",
        "Antarmuka Fitur Tanya Jawab AI Chat pada Workspace Modul Pembelajaran",
        "Tangkapan layar antarmuka aktual aplikasi AiDen pada panel ruang kerja (Workspace). "
        "Terlihat antarmuka percakapan AI Chat interaktif berdampingan dengan penampil dokumen modul PDF, "
        "menampilkan respon asisten belajar Aiden beserta navigasi tab ringkasan, flashcard, kuis, dan catatan.",
        actual_image_path="public/ss.png"
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # 4.3.3 Implementasi Fitur Peringkasan Dokumen
    story.append(Paragraph("4.3.3 Implementasi Fitur Peringkasan Dokumen (Summary)", h1_style))
    story.append(Paragraph(
        "Fitur Peringkasan Dokumen (<i>Summary</i>) diimplementasikan pada <code>app/api/generate/summary/route.ts</code> "
        "dan antarmuka <code>components/features/summary/SummaryPanel.tsx</code>. Fitur ini dirancang untuk membaca seluruh isi materi "
        "dokumen modul yang telah diindeks ke dalam basis data vektor, kemudian menyusun intisari materi secara terstruktur. Tahapannya meliputi:",
        body_style
    ))

    summary_steps = [
        "<b>1. Penarikan Seluruh Fragmen Dokumen:</b> Endpoint memanggil fungsi <code>getAllWorkspaceChunks()</code> untuk mengambil seluruh chunk materi yang tersimpan di tabel <code>document_chunks</code>, diurutkan berdasarkan <code>chunk_index</code> agar hierarki pembahasan tidak teracak.",
        "<b>2. Pemformatan Konteks Materi:</b> Potongan teks dirangkai dengan penanda <code>[Bagian Dokumen #N]</code> untuk memudahkan model AI memberikan rujukan sitasi bagian modul.",
        "<b>3. Generasi Ringkasan Terstruktur:</b> Model AI menyusun ringkasan dalam format terstandarisasi: Judul Materi, Konsep Utama (beserta nomor rujukan halaman/bagian), Penjelasan Detail, Konsep Penting, dan Rangkuman Penutup.",
        "<b>4. Penyimpanan dan Caching Hasil:</b> Hasil ringkasan disimpan ke tabel <code>summaries</code> di Supabase. Permintaan berikutnya akan mengambil ringkasan yang tersimpan dari basis data tanpa melakukan inferensi ulang, kecuali tombol 'Generate Ulang' ditekan.",
        "<b>5. Penyajian Antarmuka & Integrasi Catatan:</b> Ringkasan ditampilkan dalam format Markdown dengan tombol aksi cepat untuk menyalin teks atau menyimpannya langsung ke fitur Catatan."
    ]
    for s in summary_steps:
        story.append(Paragraph(s, list_item_style))

    story.append(Spacer(1, 6))

    # Potongan Kode 9: Summary Chunk Retrieval
    story.append(build_meta_box(
        "app/api/generate/summary/route.ts",
        "Baris 46–53",
        "Pengambilan Seluruh Fragmen Teks Dokumen Workspace Secara Terurut"
    ))
    code_summary_retrieval = (
        "// RAG Retrieval — Fetch document chunks from vector store for this workspace\n"
        "let contextText = \"\"\n"
        "const ragChunks = await getAllWorkspaceChunks(supabase, workspaceId)\n"
        "\n"
        "if (ragChunks.length > 0) {\n"
        "  contextText = formatChunksForPrompt(ragChunks)\n"
        "}"
    )
    story.append(create_code_table(code_summary_retrieval, 46))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi <code>getAllWorkspaceChunks()</code> mengambil seluruh potongan teks dokumen modul "
        "yang terkait dengan ID workspace aktif dari tabel <code>document_chunks</code>. Potongan teks tersebut diurutkan "
        "sesuai urutan aslinya, lalu diformat menggunakan <code>formatChunksForPrompt()</code> menjadi teks konteks komprehensif.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 10: Summary AI Call
    story.append(build_meta_box(
        "app/api/generate/summary/route.ts",
        "Baris 128–135",
        "Pemanggilan Model AI untuk Menghasilkan Ringkasan Terstruktur"
    ))
    code_summary_gen = (
        "// Generate Summary via Gemini API\n"
        "const { text: summaryText } = await generateText({\n"
        "  model: google(CHAT_MODEL),\n"
        "  system: systemInstruction,\n"
        "  messages: promptMessages,\n"
        "  temperature: 0.3,\n"
        "  maxTokens: 8192,\n"
        "})"
    )
    story.append(create_code_table(code_summary_gen, 128))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi <code>generateText()</code> mengeksekusi inferensi model AI dengan parameter <code>temperature: 0.3</code> "
        "agar keluaran ringkasan bersifat faktual, konsisten, dan terfokus pada materi. Batas token hingga 8.192 token dialokasikan untuk mengakomodasi ringkasan modul pembelajaran yang panjang.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 11: Summary Upsert Storage
    story.append(build_meta_box(
        "app/api/generate/summary/route.ts",
        "Baris 140–166",
        "Penyimpanan Hasil Ringkasan ke Tabel summaries pada Supabase"
    ))
    code_summary_store = (
        "if (existingSummary) {\n"
        "  const { data: updated } = await supabase\n"
        "    .from(\"summaries\")\n"
        "    .update({\n"
        "      title: `Summary - ${workspaceTitle}`,\n"
        "      content: { text: summaryText },\n"
        "    })\n"
        "    .eq(\"id\", existingSummary.id)\n"
        "    .select().single()\n"
        "  savedSummary = updated\n"
        "} else {\n"
        "  const { data: inserted } = await supabase\n"
        "    .from(\"summaries\")\n"
        "    .insert({\n"
        "      workspace_id: workspaceId,\n"
        "      user_id: user.id,\n"
        "      title: `Summary - ${workspaceTitle}`,\n"
        "      content: { text: summaryText },\n"
        "    })\n"
        "    .select().single()\n"
        "  savedSummary = inserted\n"
        "}"
    )
    story.append(create_code_table(code_summary_store, 140))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Hasil ringkasan teks disimpan ke tabel <code>summaries</code> menggunakan pola pembaruan (<i>update</i>) "
        "jika data ringkasan untuk workspace tersebut sudah ada sebelumnya, atau penambahan data baru (<i>insert</i>) jika belum pernah dibuat. "
        "Konten ringkasan disimpan dalam kolom bertipe JSONB untuk fleksibilitas struktur data.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot Box Summary
    for flow in build_screenshot_box(
        "IV.2",
        "Antarmuka Fitur Peringkasan Dokumen (Summary) Berbasis Konteks RAG",
        "Menampilkan tab Summary pada workspace AiDen. Tampak hasil ringkasan terstruktur lengkap dengan Konsep Utama, Penjelasan Detail, rujukan halaman/bagian materi, serta tombol aksi Salin dan Simpan ke Catatan.",
        action_note="Buka Workspace pembelajaran aktif, klik tab 'Summary' di panel kanan, dan tangkap layar tampilan ringkasan materi yang telah digenerate."
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # 4.3.4 Implementasi Fitur Flashcard dan Kuis Interaktif
    story.append(Paragraph("4.3.4 Implementasi Fitur Flashcard dan Kuis Interaktif", h1_style))
    story.append(Paragraph(
        "Fitur Flashcard dan Kuis Interaktif berfungsi sebagai modul evaluasi belajar mandiri yang dirancang "
        "untuk menguji tingkat pemahaman dan mengingat kembali konsep-konsep kunci modul pembelajaran.",
        body_style
    ))

    # A. Flashcard
    story.append(Paragraph("A. Implementasi Fitur Flashcard Interaktif", h2_style))
    story.append(Paragraph(
        "Fitur Flashcard diimplementasikan pada <code>app/api/generate/flashcards/route.ts</code> dan antarmuka "
        "<code>components/features/flashcards/FlashcardPanel.tsx</code>. Proses implementasi mencakup:",
        body_style
    ))

    fc_steps = [
        "<b>1. Pengambilan Konteks Dokumen RAG:</b> Materi dasar pembuatan kartu ditarik dari potongan dokumen workspace menggunakan <code>getAllWorkspaceChunks()</code> agar pertanyaan bersumber langsung dari modul perkuliahan.",
        "<b>2. Generasi Struktur Kartu Berformat JSON:</b> Model AI diinstruksikan menyusun tepat 5 atau 10 kartu tanya-jawab dalam format JSON murni: <code>{\"cards\": [{\"front\": \"pertanyaan\", \"back\": \"jawaban + rujukan halaman\"}]}</code>.",
        "<b>3. Validasi dan Parsing JSON:</b> Server melakukan pembersihan tag Markdown dan memvalidasi kelengkapan bidang pertanyaan dan jawaban sebelum disimpan.",
        "<b>4. Penyimpanan dan Penyajian Interaktif:</b> Data kartu disimpan ke tabel <code>flashcards</code> kolom JSONB. Pada sisi antarmuka, kartu disajikan dengan efek animasi putar 3D (<i>card flip</i>), navigasi acak (<i>shuffle</i>), serta tombol penanda pemahaman (Mudah, Sedang, Sulit)."
    ]
    for s in fc_steps:
        story.append(Paragraph(s, list_item_style))

    story.append(Spacer(1, 6))

    # Potongan Kode 12: Flashcard Generation
    story.append(build_meta_box(
        "app/api/generate/flashcards/route.ts",
        "Baris 66–79",
        "Instruksi Pembuatan Flashcard Terstruktur Berformat JSON dari Konteks Dokumen"
    ))
    code_fc_gen = (
        "const systemInstruction = `Kamu adalah Aiden, temen belajar yang gaul dan pinter. ` +\n"
        "  `Tugasmu bikin flashcard dari konteks materi dokumen yang disediakan.\\n\\n` +\n"
        "  `PENTING: Output HANYA berupa JSON valid. TANPA markdown, TANPA backtick. Langsung JSON mentah.\\n\\n` +\n"
        "  `Format JSON yang WAJIB diikuti:\\n` +\n"
        "  `{\"cards\":[{\"front\":\"pertanyaan singkat\",\"back\":\"jawaban singkat 1-2 kalimat\"}]}\\n\\n` +\n"
        "  `ATURAN KETAT:\\n` +\n"
        "  `- Buat TEPAT ${count} flashcard — tidak boleh lebih, tidak boleh kurang\\n` +\n"
        "  `- Front: pertanyaan/soal singkat tentang konsep penting dari dokumen\\n` +\n"
        "  `- Back: jawaban singkat padat beserta rujukan bagian/halaman dokumen (misal: \"... (Hal. 2)\")\\n` +\n"
        "  `- HANYA dari isi konteks materi dokumen yang disediakan melalui sistem RAG`"
    )
    story.append(create_code_table(code_fc_gen, 66))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Potongan instruksi sistem ini menegaskan bahwa keluaran model AI harus berformat JSON valid "
        "tanpa pembungkus blok markdown tambahan. Setiap kartu wajib memiliki sisi depan (pertanyaan) dan sisi belakang (jawaban ringkas beserta rujukan halaman modul).",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 13: Flashcard Storage
    story.append(build_meta_box(
        "app/api/generate/flashcards/route.ts",
        "Baris 146–172",
        "Penyimpanan Kumpulan Flashcard ke Tabel flashcards pada Supabase"
    ))
    code_fc_store = (
        "if (existing) {\n"
        "  const { data: updated } = await supabase\n"
        "    .from(\"flashcards\")\n"
        "    .update({\n"
        "      title: `Flashcard - ${workspaceTitle}`,\n"
        "      content: { cards, cardCount: count },\n"
        "    })\n"
        "    .eq(\"id\", existing.id)\n"
        "    .select().single()\n"
        "  savedFlashcard = updated\n"
        "} else {\n"
        "  const { data: inserted } = await supabase\n"
        "    .from(\"flashcards\")\n"
        "    .insert({\n"
        "      workspace_id: workspaceId,\n"
        "      user_id: user.id,\n"
        "      title: `Flashcard - ${workspaceTitle}`,\n"
        "      content: { cards, cardCount: count },\n"
        "    })\n"
        "    .select().single()\n"
        "  savedFlashcard = inserted\n"
        "}"
    )
    story.append(create_code_table(code_fc_store, 146))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Kumpulan kartu flashcard yang telah divalidasi disimpan ke tabel <code>flashcards</code> "
        "pada kolom JSONB <code>content</code>. Pola <i>upsert</i> memastikan data kartu yang diperbarui tersimpan tanpa duplikasi entri dalam satu ruang kerja.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot Flashcard
    for flow in build_screenshot_box(
        "IV.3",
        "Antarmuka Fitur Flashcard Belajar Interaktif 3D Card-Flip",
        "Menampilkan antarmuka kartu flashcard interaktif pada workspace AiDen. Tampak bagian kartu pertanyaan dan jawaban dengan animasi balik kartu 3D, kontrol navigasi, serta opsi penilaian tingkat pemahaman.",
        action_note="Navigasikan ke tab 'Flashcard' pada workspace pembelajaran, buka salah satu kartu untuk memperlihatkan animasi flip, dan ambil screenshot antarmuka."
    ):
        story.append(flow)

    story.append(Spacer(1, 8))

    # B. Quiz
    story.append(Paragraph("B. Implementasi Fitur Kuis Interaktif Pilihan Ganda", h2_style))
    story.append(Paragraph(
        "Fitur Kuis Interaktif diimplementasikan pada <code>app/api/generate/quiz/route.ts</code>, "
        "<code>app/api/quiz/submit-attempt/route.ts</code>, dan <code>components/features/quiz/QuizPanel.tsx</code>. "
        "Mekanisme teknis fitur ini mencakup:",
        body_style
    ))

    quiz_steps = [
        "<b>1. Pengambilan Konteks Materi RAG:</b> Seluruh butir soal kuis dibuat berdasarkan konteks modul materi yang ditarik menggunakan modul <code>getAllWorkspaceChunks()</code>.",
        "<b>2. Generasi Soal dan Kunci Berformat JSON:</b> AI menghasilkan soal pilihan ganda lengkap dengan 4 opsi pilihan, indeks kunci jawaban benar (0-3), pembahasan logis, dan rujukan nomor halaman (<code>pageRef</code>).",
        "<b>3. Pengerjaan Soal dan Validasi Jawaban:</b> Komponen antarmuka memfasilitasi pengguna memilih opsi jawaban per butir soal, melacak navigasi soal yang sudah dijawab, serta menghitung skor akhir secara otomatis saat kuis diselesaikan.",
        "<b>4. Pencatatan Riwayat Percobaan Kuis:</b> Hasil pengerjaan (skor persentase, jumlah benar, dan rincian jawaban pengguna) dikirim ke API <code>/api/quiz/submit-attempt</code> untuk disimpan ke dalam array <code>attempts</code> pada tabel <code>quizzes</code> dan dicatat ke <code>activity_logs</code>."
    ]
    for s in quiz_steps:
        story.append(Paragraph(s, list_item_style))

    story.append(Spacer(1, 6))

    # Potongan Kode 14: Quiz Generation
    story.append(build_meta_box(
        "app/api/generate/quiz/route.ts",
        "Baris 69–80",
        "Struktur Format JSON Soal Kuis Pilihan Ganda dengan Sitasi Halaman"
    ))
    code_quiz_gen = (
        "Format JSON yang WAJIB diikuti:\n"
        "{\n"
        "  \"questions\": [\n"
        "    {\n"
        "      \"id\": 1,\n"
        "      \"question\": \"teks pertanyaan...\",\n"
        "      \"options\": [\"pilihan A\", \"pilihan B\", \"pilihan C\", \"pilihan D\"],\n"
        "      \"answerIndex\": 0,\n"
        "      \"explanation\": \"Penjelasan AI ringkas dan jelas mengapa jawaban tersebut benar...\",\n"
        "      \"pageRef\": \"Hal. 2\"\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    story.append(create_code_table(code_quiz_gen, 69))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Spesifikasi format JSON untuk kuis mengharuskan model AI menyertakan teks pertanyaan, "
        "4 opsi pilihan jawaban, indeks jawaban benar (<code>answerIndex</code> bernilai 0 hingga 3), penjelasan ilmiah "
        "mengenai alasan jawaban benar, serta rujukan halaman modul materi (<code>pageRef</code>).",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 15: Quiz Attempt Saving
    story.append(build_meta_box(
        "app/api/quiz/submit-attempt/route.ts",
        "Baris 33–55",
        "Pencatatan Riwayat Percobaan Pengerjaan Kuis dan Skor Nilai Pengguna"
    ))
    code_quiz_attempt = (
        "const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`\n"
        "const newAttempt = {\n"
        "  attempt_id: attemptId,\n"
        "  created_at: new Date().toISOString(),\n"
        "  score_percentage: scorePercentage,\n"
        "  correct_count: correctCount,\n"
        "  total_count: totalCount,\n"
        "  user_answers: userAnswers,\n"
        "}\n"
        "\n"
        "const updatedAttempts = [newAttempt, ...attempts]\n"
        "\n"
        "const { data: updatedQuiz } = await supabase\n"
        "  .from(\"quizzes\")\n"
        "  .update({\n"
        "    content: {\n"
        "      ...content,\n"
        "      attempts: updatedAttempts,\n"
        "    },\n"
        "  })\n"
        "  .eq(\"id\", quiz.id)\n"
        "  .select().single()"
    )
    story.append(create_code_table(code_quiz_attempt, 33))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Saat pengguna menyelesaikan kuis, API menyusun objek rekaman percobaan (<i>attempt</i>) "
        "yang mencakup identitas percobaan unik, waktu pengerjaan, persentase nilai, jumlah jawaban benar, dan daftar opsi yang dipilih. "
        "Objek ini kemudian ditambahkan ke riwayat percobaan kuis pada tabel <code>quizzes</code>.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot Quiz
    for flow in build_screenshot_box(
        "IV.4",
        "Antarmuka Fitur Kuis Pilihan Ganda dan Hasil Evaluasi Jawaban",
        "Menampilkan antarmuka pengerjaan kuis pilihan ganda pada workspace AiDen. Terlihat daftar butir pertanyaan, pilihan opsi jawaban, nomor soal aktif, dan tampilan evaluasi hasil skor beserta pembahasan jawaban.",
        action_note="Navigasikan ke tab 'Quiz' pada workspace, selesaikan pengerjaan kuis untuk menampilkan ringkasan skor dan pembahasan jawaban, lalu ambil tangkapan layar."
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # 4.3.5 Implementasi Fitur Catatan dan Riwayat Pembelajaran
    story.append(Paragraph("4.3.5 Implementasi Fitur Catatan dan Riwayat Pembelajaran", h1_style))
    story.append(Paragraph(
        "Fitur Catatan (<i>Notes</i>) dan Riwayat Pembelajaran (<i>Activity History</i>) berfungsi sebagai "
        "alat manajemen belajar mandiri pengguna di dalam ekosistem aplikasi AiDen.",
        body_style
    ))

    # A. Notes
    story.append(Paragraph("A. Implementasi Fitur Catatan Pembelajaran (Notes)", h2_style))
    story.append(Paragraph(
        "Fitur Catatan diimplementasikan melalui API route <code>app/api/notes/route.ts</code>, "
        "endpoint integrasi ringkasan <code>app/api/summary/save-note/route.ts</code>, dan antarmuka "
        "<code>components/features/notes/notes-client.tsx</code>. Fitur ini memungkinkan pengguna membuat catatan mandiri, "
        "mengedit isi catatan, menghapus catatan dengan dialog konfirmasi SweetAlert2, serta menyimpan intisari hasil ringkasan materi ke dalam catatan secara instan.",
        body_style
    ))

    # Potongan Kode 16: Notes Creation
    story.append(build_meta_box(
        "app/api/notes/route.ts",
        "Baris 58–73",
        "Operasi Pembuatan Catatan Baru dan Penyimpanan ke Tabel notes"
    ))
    code_notes_create = (
        "const insertPayload: any = {\n"
        "  user_id: user.id,\n"
        "  workspace_id: targetWorkspaceId,\n"
        "  title,\n"
        "  content,\n"
        "}\n"
        "if (category) {\n"
        "  insertPayload.category = category\n"
        "}\n"
        "\n"
        "const { data: newNote, error: insertError } = await supabase\n"
        "  .from(\"notes\")\n"
        "  .insert(insertPayload)\n"
        "  .select()\n"
        "  .single()"
    )
    story.append(create_code_table(code_notes_create, 58))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Potongan kode di atas menangani pembuatan catatan baru dengan mengaitkan identitas pengguna (<code>user_id</code>) "
        "dan ID ruang kerja aktif (<code>targetWorkspaceId</code>). Judul, isi teks, dan kategori catatan disimpan ke dalam tabel <code>notes</code> di Supabase.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 17: Save Summary to Note
    story.append(build_meta_box(
        "app/api/summary/save-note/route.ts",
        "Baris 19–33",
        "Integrasi Penyimpanan Hasil Ringkasan RAG ke Dalam Fitur Catatan"
    ))
    code_summary_to_note = (
        "const insertPayload: any = {\n"
        "  workspace_id: workspaceId,\n"
        "  user_id: user.id,\n"
        "  title: title || \"Ringkasan Materi\",\n"
        "  content: content,\n"
        "  category: \"Summary\",\n"
        "}\n"
        "\n"
        "const { data: insertedData, error: insertError } = await supabase\n"
        "  .from(\"notes\")\n"
        "  .insert(insertPayload)\n"
        "  .select()\n"
        "  .single()"
    )
    story.append(create_code_table(code_summary_to_note, 19))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Endpoint ini memungkinkan hasil generasi ringkasan materi dari tab Summary "
        "disimpan langsung menjadi dokumen catatan pengguna dengan kategori khusus <code>'Summary'</code>, "
        "sehingga pengguna dapat mengedit atau membaca kembali intisari materi di halaman Catatan.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot Notes
    for flow in build_screenshot_box(
        "IV.5",
        "Antarmuka Fitur Manajemen Catatan Pembelajaran (Notes)",
        "Menampilkan halaman manajemen catatan belajar pengguna yang menyajikan daftar kartu catatan, kolom pencarian, filter kategori materi, serta tombol aksi untuk menambah, mengedit, melihat pratinjau, dan menghapus catatan.",
        action_note="Buka menu navigasi utama 'Catatan' (/notes) pada aplikasi AiDen dan ambil tangkapan layar daftar catatan pembelajaran yang tersimpan."
    ):
        story.append(flow)

    story.append(Spacer(1, 8))

    # B. History
    story.append(Paragraph("B. Implementasi Fitur Riwayat Pembelajaran (Activity History)", h2_style))
    story.append(Paragraph(
        "Fitur Riwayat Pembelajaran diimplementasikan melalui API route <code>app/api/history/route.ts</code> "
        "dan komponen antarmuka <code>components/features/history/history-card.tsx</code>. Sistem secara otomatis "
        "mencatat setiap aksi belajar yang dilakukan pengguna ke dalam tabel <code>activity_logs</code>. "
        "Aktivitas yang dicatat mencakup pembuatan workspace, interaksi tanya-jawab AI Chat, pembuatan ringkasan, "
        "generasi flashcard, pembuatan kuis, pengerjaan kuis beserta nilai skor, dan pembuatan catatan.",
        body_style
    ))

    # Potongan Kode 18: Activity Logging Action
    story.append(build_meta_box(
        "app/api/notes/route.ts",
        "Baris 110–120",
        "Pencatatan Otomatis Log Aktivitas Pengguna ke Tabel activity_logs"
    ))
    code_history_log = (
        "await supabase.from(\"activity_logs\").insert({\n"
        "  user_id: user.id,\n"
        "  workspace_id: workspaceId || null,\n"
        "  action_type: \"CREATE_NOTE\",\n"
        "  details: {\n"
        "    title,\n"
        "    target_url: \"/notes\",\n"
        "    note_id: newNote.id,\n"
        "  },\n"
        "})"
    )
    story.append(create_code_table(code_history_log, 110))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Setiap kali terjadi aksi penting (seperti pembuatan catatan), sistem mengeksekusi penyisipan data "
        "ke tabel <code>activity_logs</code> dengan menyimpan tipe aksi (<code>CREATE_NOTE</code>) dan objek rincian metadata (<code>details</code>) "
        "berupa judul, tautan navigasi balik, serta ID entitas terkait.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Potongan Kode 19: History Display Mapping
    story.append(build_meta_box(
        "components/features/history/history-card.tsx",
        "Baris 48–61",
        "Pemetaan Konfigurasi Visual dan Deskripsi Riwayat Aktivitas Pembelajaran"
    ))
    code_history_ui = (
        "GENERATE_FLASHCARD: {\n"
        "  label: \"Flashcard\",\n"
        "  icon: BrainCircuit,\n"
        "  color: \"text-emerald-500\",\n"
        "  bgClass: \"bg-emerald-500/10\",\n"
        "  badgeClass: \"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20\",\n"
        "  getDescription: (log) => {\n"
        "    const title = log.details?.title ?? log.workspaces?.title ?? \"dokumen\"\n"
        "    const count = log.details?.cardCount\n"
        "    return count\n"
        "      ? `Membuat ${count} flashcard dari \"${title}\"`\n"
        "      : `Membuat flashcard dari \"${title}\"`\n"
        "  },\n"
        "},"
    )
    story.append(create_code_table(code_history_ui, 48))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Pada sisi antarmuka, objek konfigurasi <code>ACTION_CONFIG</code> memetakan setiap tipe aksi log menjadi "
        "ikon visual, warna badge tematik, dan teks deskripsi dinamis berbahasa Indonesia sehingga riwayat aktivitas pengguna dapat dibaca secara informatif.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot History
    for flow in build_screenshot_box(
        "IV.6",
        "Antarmuka Riwayat Aktivitas Pembelajaran Pengguna (Activity History)",
        "Menampilkan halaman linimasa riwayat pembelajaran pengguna pada aplikasi AiDen. Terlihat pencatatan kronologis aktivitas pengerjaan kuis, pembuatan flashcard, chat AI, dan ringkasan lengkap dengan filter kategori dan tautan kembali ke materi.",
        action_note="Buka menu navigasi utama 'Riwayat' (/history) pada aplikasi AiDen dan ambil tangkapan layar linimasa aktivitas belajar yang tercatat."
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # Dokumentasi Basis Data
    story.append(Paragraph("Dokumentasi Implementasi Basis Data (Database Implementation)", h1_style))
    story.append(Paragraph(
        "Aplikasi AiDen menggunakan basis data relasional PostgreSQL yang dikelola melalui platform <i>Supabase</i>. "
        "Untuk mendukung penyimpanan representasi numerik dokumen pembelajaran dan pencarian kemiripan semantik, "
        "diaktifkan ekstensi <code>vector</code> (pgvector). Keamanan akses data antar pengguna dijamin melalui penerapan "
        "kebijakan <i>Row Level Security</i> (RLS) pada seluruh entitas tabel. Berikut adalah struktur dokumentasi tabel basis data aktual yang digunakan oleh aplikasi:",
        body_style
    ))

    db_tables_data = [
        [
            Paragraph("<b>Nama Tabel</b>", table_header_style),
            Paragraph("<b>Kolom Utama & Tipe Data</b>", table_header_style),
            Paragraph("<b>Relasi (Foreign Key)</b>", table_header_style),
            Paragraph("<b>Fungsi dalam Implementasi & RAG</b>", table_header_style)
        ],
        [
            Paragraph("<b>users</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>full_name (TEXT)<br/>avatar_url (TEXT)<br/>role (TEXT)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("auth.users.id (CASCADE)", table_cell_style),
            Paragraph("Menyimpan data profil pengguna terverifikasi yang diperluas dari sistem autentikasi Supabase.", table_cell_style)
        ],
        [
            Paragraph("<b>workspaces</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>description (TEXT)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("users.id (CASCADE)", table_cell_style),
            Paragraph("Ruang belajar utama pengguna yang mengelompokkan dokumen materi, ringkasan, flashcard, dan kuis.", table_cell_style)
        ],
        [
            Paragraph("<b>documents</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>name (TEXT)<br/>storage_path (TEXT)<br/>status (TEXT)<br/>error_message (TEXT)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan metadata file PDF modul pembelajaran yang diunggah ke Storage bucket serta status proses pemrosesan ('pending', 'processing', 'completed', 'failed').", table_cell_style)
        ],
        [
            Paragraph("<b>document_chunks</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>document_id (UUID, FK)<br/>workspace_id (UUID, FK)<br/>content (TEXT)<br/>embedding (VECTOR 3072)<br/>metadata (JSONB)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("documents.id<br/>workspaces.id", table_cell_style),
            Paragraph("<b>Entitas Inti RAG:</b> Menyimpan pecahan teks modul (chunk) dan vektor dense 3.072 dimensi dari model gemini-embedding-001 dengan indeks akselerasi HNSW.", table_cell_style)
        ],
        [
            Paragraph("<b>summaries</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (JSONB)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan intisari materi terstruktur hasil generasi AI berbasis seluruh chunk dokumen modul.", table_cell_style)
        ],
        [
            Paragraph("<b>flashcards</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (JSONB)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan kumpulan kartu tanya-jawab ringkas berbasis materi dokumen modul dalam format JSONB.", table_cell_style)
        ],
        [
            Paragraph("<b>quizzes</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (JSONB)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan butir soal pilihan ganda, kunci jawaban, pembahasan, serta riwayat percobaan pengerjaan pengguna (attempts).", table_cell_style)
        ],
        [
            Paragraph("<b>notes</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (TEXT)<br/>category (TEXT)<br/>created_at (TIMESTAMPTZ)<br/>updated_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan catatan belajar mandiri pengguna baik yang ditulis langsung maupun diekspor dari hasil ringkasan materi.", table_cell_style)
        ],
        [
            Paragraph("<b>chats</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>user_id (UUID, FK)<br/>workspace_id (UUID, FK)<br/>title (TEXT)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("users.id<br/>workspaces.id", table_cell_style),
            Paragraph("Mengelola sesi percakapan asisten belajar yang terikat dengan ruang kerja pengguna.", table_cell_style)
        ],
        [
            Paragraph("<b>messages</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>chat_id (UUID, FK)<br/>role (TEXT)<br/>content (TEXT)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("chats.id", table_cell_style),
            Paragraph("Menyimpan pesan percakapan individual baik dari sisi pengguna ('user') maupun asisten ('assistant').", table_cell_style)
        ],
        [
            Paragraph("<b>notifications</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>message (TEXT)<br/>is_read (BOOLEAN)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("users.id", table_cell_style),
            Paragraph("Menyimpan pemberitahuan sistem kepada pengguna terkait proses pemrosesan modul, ringkasan, atau kuis yang telah selesai.", table_cell_style)
        ],
        [
            Paragraph("<b>activity_logs</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>user_id (UUID, FK)<br/>workspace_id (UUID, FK)<br/>action_type (TEXT)<br/>details (JSONB)<br/>created_at (TIMESTAMPTZ)", table_cell_style),
            Paragraph("users.id<br/>workspaces.id", table_cell_style),
            Paragraph("Menyimpan rekaman audit aktivitas belajar pengguna untuk disajikan pada halaman linimasa riwayat pembelajaran.", table_cell_style)
        ]
    ]

    db_table = Table(db_tables_data, colWidths=[80, 115, 90, 155])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))

    story.append(db_table)
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<i>Tabel IV.1: Dokumentasi Struktur Entitas Basis Data Aktual Aplikasi AiDen</i>",
        ParagraphStyle("CaptionTable", fontName="Helvetica-Oblique", fontSize=8.5, alignment=1)
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_pdf_path}")


def generate_docx(output_docx_path):
    doc = docx.Document()
    
    # Set page margins to standard academic: Left 3cm, Right 2.5cm, Top 2.8cm, Bottom 2.5cm
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.1)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.18) # ~3 cm
        section.right_margin = Inches(0.98) # ~2.5 cm

    # Set normal style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.name = 'Times New Roman'
        p.paragraph_format.space_after = Pt(12)

    def add_h1(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.name = 'Times New Roman'
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)

    def add_h2(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.name = 'Times New Roman'
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)

    def add_body(text, indent=True):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if indent:
            p.paragraph_format.first_line_indent = Inches(0.4)
        p.paragraph_format.space_after = Pt(5)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)

    def add_list_item(bold_title, desc):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(bold_title + ": ")
        r1.bold = True
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(10.5)
        r2 = p.add_run(desc)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(10.5)

    def add_code_block(file_path, line_range, title, code_lines, start_line, explanation):
        # Metadata Table
        t_meta = doc.add_table(rows=1, cols=1)
        t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
        t_meta.autofit = False
        t_meta.columns[0].width = Inches(6.3)
        
        cell_meta = t_meta.rows[0].cells[0]
        shading = parse_xml(r'<w:shd {} w:fill="EFF6FF"/>'.format(nsdecls('w')))
        cell_meta._tc.get_or_add_tcPr().append(shading)
        
        p_m = cell_meta.paragraphs[0]
        p_m.paragraph_format.space_after = Pt(0)
        p_m.paragraph_format.line_spacing = 1.15
        
        r = p_m.add_run("Nama File: ")
        r.bold = True
        r.font.size = Pt(9.5)
        r = p_m.add_run(f"{file_path}\n")
        r.font.name = 'Consolas'
        r.font.size = Pt(9.5)
        
        r = p_m.add_run("Lokasi Kode: ")
        r.bold = True
        r.font.size = Pt(9.5)
        r = p_m.add_run(f"{line_range}\n")
        r.font.size = Pt(9.5)
        
        r = p_m.add_run("Judul Potongan Kode: ")
        r.bold = True
        r.font.size = Pt(9.5)
        r = p_m.add_run(f"{title}")
        r.font.size = Pt(9.5)

        # Code Table
        lines = code_lines.strip("\n").split("\n")
        t_code = doc.add_table(rows=len(lines), cols=2)
        t_code.alignment = WD_TABLE_ALIGNMENT.CENTER
        t_code.autofit = False
        t_code.columns[0].width = Inches(0.45)
        t_code.columns[1].width = Inches(5.85)

        for i, line in enumerate(lines):
            row = t_code.rows[i]
            # Number cell
            c0 = row.cells[0]
            shd0 = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
            c0._tc.get_or_add_tcPr().append(shd0)
            p0 = c0.paragraphs[0]
            p0.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            p0.paragraph_format.space_after = Pt(0)
            p0.paragraph_format.line_spacing = 1.0
            r0 = p0.add_run(str(start_line + i))
            r0.font.name = 'Consolas'
            r0.font.size = Pt(8.5)
            r0.font.color.rgb = RGBColor(0x64, 0x74, 0x8b)

            # Code cell
            c1 = row.cells[1]
            shd1 = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
            c1._tc.get_or_add_tcPr().append(shd1)
            p1 = c1.paragraphs[0]
            p1.paragraph_format.space_after = Pt(0)
            p1.paragraph_format.line_spacing = 1.0
            r1 = p1.add_run(line)
            r1.font.name = 'Consolas'
            r1.font.size = Pt(8.5)
            r1.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        # Explanation
        p_exp = doc.add_paragraph()
        p_exp.paragraph_format.space_before = Pt(4)
        p_exp.paragraph_format.space_after = Pt(8)
        p_exp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_lbl = p_exp.add_run("Penjelasan Kode: ")
        r_lbl.bold = True
        r_lbl.font.size = Pt(10.5)
        r_exp = p_exp.add_run(explanation)
        r_exp.font.size = Pt(10.5)

    def add_screenshot_doc(fig_num, fig_title, desc_text, actual_image_path=None, action_note=None):
        if actual_image_path and os.path.exists(actual_image_path):
            doc.add_picture(actual_image_path, width=Inches(6.2))
        else:
            t = doc.add_table(rows=1, cols=1)
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            t.autofit = False
            t.columns[0].width = Inches(6.3)
            c = t.rows[0].cells[0]
            shd = parse_xml(r'<w:shd {} w:fill="F0F9FF"/>'.format(nsdecls('w')))
            c._tc.get_or_add_tcPr().append(shd)
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(f"[DOKUMENTASI HASIL IMPLEMENTASI ANTARMUKA: GAMBAR {fig_num}]\n")
            r.bold = True
            r.font.size = Pt(10)
            r.font.color.rgb = RGBColor(0x03, 0x69, 0xa1)
            r = p.add_run(f"Target Tampilan: {fig_title}\n\n")
            r.bold = True
            r.font.size = Pt(9.5)
            r = p.add_run(f"Panduan Pengambilan Screenshot Mandiri:\n{action_note if action_note else 'Jalankan server aplikasi (npm run dev) dan tangkap layar antarmuka terkait.'}")
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(2)
        r_num = p_cap.add_run(f"Gambar {fig_num}. ")
        r_num.bold = True
        r_num.font.size = Pt(10)
        r_title = p_cap.add_run(fig_title)
        r_title.bold = True
        r_title.font.size = Pt(10)

        p_desc = doc.add_paragraph()
        p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_desc.paragraph_format.space_after = Pt(10)
        r_lbl = p_desc.add_run("Keterangan: ")
        r_lbl.italic = True
        r_lbl.font.size = Pt(9.5)
        r_d = p_desc.add_run(desc_text)
        r_d.font.size = Pt(9.5)

    # WRITE CONTENT
    add_title("BAB IV\nIMPLEMENTASI SISTEM")
    add_h1("4.3 Development")
    add_body(
        "Tahap Development (Pengembangan) merupakan fase ketiga dalam metodologi ADDIE "
        "(Analysis, Design, Development, Implementation, Evaluation). Pada tahap ini, seluruh cetak biru, "
        "rancangan arsitektur basis data, diagram alir, dan desain antarmuka pengguna yang telah disusun pada tahap Design "
        "diterjemahkan secara sistematis menjadi kode program aplikasi AiDen (AI Learning Assistant). "
        "Fokus utama pengembangan adalah membangun sistem berbantuan kecerdasan artifisial yang mampu membantu mahasiswa "
        "memahami materi kuliah berbasis dokumen modul pembelajaran secara mandiri dan terstruktur."
    )
    add_body(
        "Implementasi teknis aplikasi AiDen dibangun dengan memanfaatkan kerangka kerja Next.js 16 App Router, "
        "bahasa pemrograman TypeScript, pustaka Vercel AI SDK (@ai-sdk/google), serta basis data relasional "
        "Supabase PostgreSQL yang dilengkapi ekstensi pgvector. Melalui pendekatan Retrieval-Augmented Generation "
        "(RAG), sistem dirancang untuk membatasi ruang lingkup inferensi model bahasa besar (Large Language Model) "
        "agar selalu merujuk pada konteks materi dokumen modul yang diunggah pengguna. Hal ini bertujuan untuk meminimalkan timbulnya "
        "halusinasi informasi dan menjaga konsistensi jawaban sesuai dengan materi akademis yang dipelajari."
    )

    add_h1("4.3.1 Implementasi RAG (Retrieval-Augmented Generation)")
    add_body(
        "Penerapan arsitektur Retrieval-Augmented Generation (RAG) pada AiDen menjadi fondasi penting "
        "dalam menghubungkan materi dokumen perkuliahan berformat PDF dengan kapabilitas penalaran model AI. "
        "Implementasi RAG berjalan secara sistematis melalui 8 (delapan) tahapan alur kerja:"
    )

    add_list_item("1. Penerimaan dan Penyimpanan Dokumen PDF", "Dokumen modul diunggah oleh pengguna melalui dialog pembuatan workspace. File PDF disimpan pada Supabase Storage bucket materials dengan metadata dokumen dicatat ke tabel documents.")
    add_list_item("2. Ekstraksi Teks Mentah Dokumen", "Teks dokumen diekstraksi dari buffer biner PDF menggunakan pustaka pdf-parse pada fungsi processDocument() file utils/rag/processor.ts.")
    add_list_item("3. Pemecahan Teks Adaptif (Text Chunking)", "Teks hasil ekstraksi dibagi menjadi potongan teks (chunk) berukuran 1.200 karakter dengan overlap 200 karakter, memperhatikan batas baris (newline boundary) agar konteks kalimat tidak terputus sembarangan.")
    add_list_item("4. Pembuatan Vektor Dense (Batched Embedding)", "Setiap potongan teks dikonversi menjadi vektor embedding berdimensi 3.072 menggunakan model gemini-embedding-001 secara berkelompok (batch 20 chunk) guna menjaga efisiensi pemanggilan API.")
    add_list_item("5. Penyimpanan Vektor dan Metadata", "Potongan teks beserta representasi vektor numeriknya disimpan ke dalam tabel document_chunks lengkap dengan nomor urutan chunk dan total pecahan materi.")
    add_list_item("6. Akselerasi Penelusuran HNSW", "Tabel document_chunks diindeks menggunakan algoritma Hierarchical Navigable Small World (HNSW) berbasis operator vector_cosine_ops untuk pencarian tetangga terdekat berkecepatan tinggi.")
    add_list_item("7. Pencarian Kemiripan Semantik (Semantic Search)", "Kesamaan semantik dihitung melalui fungsi Stored Procedure PostgreSQL match_document_chunks() yang membandingkan cosine similarity antara embedding pertanyaan dan embedding dokumen.")
    add_list_item("8. Modul Terpadu RAG Retriever", "Modul lib/ai/rag-retriever.ts mengabstraksi fungsi penelusuran semantik (retrieveRelevantChunks) dan penarikan seluruh bab dokumen (getAllWorkspaceChunks) untuk digunakan pada seluruh fitur pembelajaran AiDen.")

    add_code_block(
        "utils/rag/processor.ts",
        "Baris 10–26",
        "Implementasi Pemecahan Teks Dokumen (Text Chunking)",
        (
            "function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {\n"
            "  const chunks: string[] = []\n"
            "  let i = 0\n"
            "  while (i < text.length) {\n"
            "    let end = i + chunkSize\n"
            "    if (end < text.length) {\n"
            "      const boundary = text.lastIndexOf(\"\\n\", end)\n"
            "      if (boundary > i + chunkSize - 100) end = boundary + 1\n"
            "    }\n"
            "    const chunk = text.slice(i, end).trim()\n"
            "    if (chunk.length > 0) chunks.push(chunk)\n"
            "    i = end - overlap\n"
            "    if (i <= 0) i = end\n"
            "  }\n"
            "  return chunks\n"
            "}"
        ),
        10,
        "Fungsi chunkText() membagi teks panjang dokumen menjadi fragmen berukuran 1.200 karakter dengan tumpang tindih (overlap) 200 karakter. Logika penyesuaian batas (boundary) memastikan pemotongan teks dilakukan pada tanda perpindahan baris (newline) terdekat dalam rentang 100 karakter terakhir, sehingga keutuhan paragraf atau kalimat tetap terjaga."
    )

    add_code_block(
        "utils/rag/processor.ts",
        "Baris 74–88",
        "Implementasi Pembuatan Embedding Vektor Berkelompok (Batch Embedding)",
        (
            "const BATCH_SIZE = 20\n"
            "const allEmbeddings: number[][] = []\n"
            "\n"
            "for (let b = 0; b < chunks.length; b += BATCH_SIZE) {\n"
            "  const batch = chunks.slice(b, b + BATCH_SIZE)\n"
            "  const { embeddings } = await embedMany({\n"
            "    model: google.textEmbeddingModel(EMBEDDING_MODEL, {\n"
            "      outputDimensionality: EMBEDDING_DIMENSIONS,\n"
            "    }),\n"
            "    values: batch,\n"
            "  })\n"
            "  allEmbeddings.push(...embeddings)\n"
            "}"
        ),
        74,
        "Potongan kode di atas mengonversi seluruh potongan teks menjadi representasi vektor dense menggunakan model gemini-embedding-001 dengan dimensi 3.072 melalui fungsi embedMany(). Pengelompokan (batching) sebesar 20 chunk per pemanggilan bertujuan untuk mematuhi batas rate limit API Google serta mengoptimalkan waktu proses jaringan."
    )

    add_code_block(
        "utils/rag/processor.ts",
        "Baris 92–109",
        "Penyimpanan Potongan Teks dan Vektor ke Tabel Basis Data",
        (
            "const chunkRecords = chunks.map((chunk, index) => ({\n"
            "  document_id: documentId,\n"
            "  workspace_id: workspaceId,\n"
            "  content: chunk,\n"
            "  embedding: allEmbeddings[index],\n"
            "  metadata: {\n"
            "    chunk_index: index,\n"
            "    total_chunks: chunks.length,\n"
            "    embedding_model: EMBEDDING_MODEL,\n"
            "    embedding_dims: EMBEDDING_DIMENSIONS,\n"
            "  },\n"
            "}))\n"
            "\n"
            "const { error: insertError } = await supabase\n"
            "  .from(\"document_chunks\")\n"
            "  .insert(chunkRecords)"
        ),
        92,
        "Potongan kode ini menyusun objek rekaman data untuk setiap chunk teks beserta vektor embedding dan metadatanya (seperti urutan nomor chunk dan model embedding yang digunakan). Data tersebut kemudian disimpan secara massal ke dalam tabel document_chunks di Supabase PostgreSQL."
    )

    add_code_block(
        "rag-migration.sql",
        "Baris 128–144",
        "Fungsi PostgreSQL RPC match_document_chunks untuk Pencarian Kesamaan Semantik",
        (
            "SELECT\n"
            "  dc.id, dc.document_id, dc.content, dc.metadata,\n"
            "  1 - (dc.embedding <=> query_embedding) AS similarity\n"
            "FROM document_chunks dc\n"
            "JOIN documents d ON d.id = dc.document_id\n"
            "WHERE\n"
            "  (filter_workspace_id IS NULL OR dc.workspace_id = filter_workspace_id)\n"
            "  AND (filter_user_id IS NULL OR d.user_id = filter_user_id)\n"
            "  AND d.status = 'completed'\n"
            "ORDER BY dc.embedding <=> query_embedding\n"
            "LIMIT match_count;"
        ),
        128,
        "Fungsi RPC ini memanfaatkan operator jarak kosinus (<=>) dari ekstensi pgvector untuk menghitung nilai kemiripan semantik (cosine similarity = 1 - distance). Kueri secara ketat membatasi pencarian berdasarkan filter_workspace_id, kepemilikan user_id, dan hanya memproses dokumen dengan status 'completed'."
    )

    add_code_block(
        "lib/ai/rag-retriever.ts",
        "Baris 31–49",
        "Pengambilan Potongan Dokumen Relevan Melalui Modul RAG Retriever",
        (
            "const { embedding } = await embed({\n"
            "  model: google.textEmbeddingModel(EMBEDDING_MODEL, {\n"
            "    outputDimensionality: EMBEDDING_DIMENSIONS,\n"
            "  }),\n"
            "  value: query,\n"
            "})\n"
            "\n"
            "const { data: chunks, error: matchError } = await supabase.rpc(\n"
            "  \"match_document_chunks\",\n"
            "  {\n"
            "    query_embedding: embedding,\n"
            "    match_count: matchCount,\n"
            "    filter_workspace_id: workspaceId,\n"
            "    filter_user_id: userId || null,\n"
            "  }\n"
            ")"
        ),
        31,
        "Fungsi retrieveRelevantChunks() menerima teks kueri pertanyaan pengguna, mengonversinya menjadi vektor embedding kueri berdimensi 3.072 secara real-time, lalu memanggil fungsi RPC match_document_chunks untuk mengambil sejumlah fragmen dokumen yang memiliki kemiripan semantik tertinggi."
    )

    add_h1("4.3.2 Implementasi Fitur Tanya Jawab dan Rujukan Sumber")
    add_body(
        "Fitur Tanya Jawab (AI Chat) diimplementasikan pada antarmuka components/features/ai-chat/AIChatPanel.tsx "
        "dan API route app/api/chat/route.ts. Fitur ini memungkinkan pengguna mengajukan pertanyaan seputar materi modul, "
        "di mana sistem akan mencari cuplikan materi yang relevan dan menyajikannya bersama rujukan sumber. Alur kerja fitur ini mencakup:"
    )

    add_list_item("1. Pengiriman Pertanyaan Pengguna", "Pengguna menginput pertanyaan melalui formulir percakapan. State pesan dikelola menggunakan hook useChat() pada sisi klien.")
    add_list_item("2. Penelusuran Semantik Konteks RAG", "Server mengekstrak teks pertanyaan pengguna terakhir dan memanggil retrieveRelevantChunks() untuk menarik hingga 5 potongan materi paling relevan.")
    add_list_item("3. Penyusunan Prompt Teraugmentasi", "Konteks dokumen yang ditemukan digabungkan dan diinjeksikan ke dalam System Prompt dengan instruksi ketat agar model menjawab hanya berdasarkan fakta teks tersebut.")
    add_list_item("4. Generasi Jawaban Streaming", "Model AI (gemini-2.5-flash) memproses jawaban dengan mekanisme streaming kata demi kata (smoothStream) untuk memberikan respons interaktif yang cepat.")
    add_list_item("5. Penyajian Rujukan Sumber", "Jawaban yang disajikan kepada pengguna menyertakan nomor bagian atau halaman materi modul pembelajaran sebagai rujukan akademis.")

    add_code_block(
        "app/api/chat/route.ts",
        "Baris 53–67",
        "Pengambilan Pertanyaan Pengguna dan Retrieval Potongan Dokumen",
        (
            "const lastMessage = messages[messages.length - 1]\n"
            "let contextText = \"\"\n"
            "\n"
            "if (lastMessage?.role === \"user\" && lastMessage.content) {\n"
            "  const chunks = await retrieveRelevantChunks(supabase, {\n"
            "    workspaceId,\n"
            "    userId: user.id,\n"
            "    query: lastMessage.content,\n"
            "    matchCount: 5,\n"
            "  })\n"
            "\n"
            "  if (chunks && chunks.length > 0) {\n"
            "    contextText = chunks.map(c => c.content).join(\"\\n\\n---\\n\\n\")\n"
            "  }\n"
            "}"
        ),
        53,
        "Server API memeriksa pesan terakhir yang dikirim oleh pengguna. Jika bertipe 'user', kueri pertanyaan diteruskan ke fungsi retrieveRelevantChunks() untuk mengambil 5 potongan teks dokumen yang paling relevan. Fragmen teks tersebut kemudian digabungkan dengan pemisah garis horizontal ke dalam variabel contextText."
    )

    add_code_block(
        "app/api/chat/route.ts",
        "Baris 78–89",
        "Penyusunan Konteks Dokumen Hasil Retrieval ke dalam System Prompt",
        (
            "let systemContent = buildSystemPrompt()\n"
            "if (contextText) {\n"
            "  systemContent +=\n"
            "    `\\n\\n[KONTEKS DARI DOKUMEN — HASIL RETRIEVAL]\\n` +\n"
            "    `Berikut adalah cuplikan materi yang paling relevan dengan pertanyaan user:\\n\\n` +\n"
            "    `${contextText}\\n\\n` +\n"
            "    `Aturan ketat:\\n` +\n"
            "    `- Jawab HANYA berdasarkan konteks di atas.\\n` +\n"
            "    `- Jika informasi tidak ada di konteks, katakan dengan jujur: \"hmm info ini kayanya ga ada di dokumen yang lu kasih ke gue 🤔\"\\n` +\n"
            "    `- Jangan mengarang atau menambah info dari luar dokumen.`\n"
            "}"
        ),
        78,
        "Variabel contextText disisipkan ke dalam systemContent. Instruksi ketat diberikan kepada model AI agar membatasi jawaban hanya pada teks hasil retrieval dan secara eksplisit mengakui apabila informasi yang ditanyakan tidak ditemukan pada dokumen, sehingga mencegah terjadinya fabrikasi jawaban."
    )

    add_code_block(
        "app/api/chat/route.ts",
        "Baris 96–104",
        "Eksekusi Generasi Respons Streaming Menggunakan Model AI",
        (
            "const result = streamText({\n"
            "  model: google(CHAT_MODEL),\n"
            "  system: systemContent,\n"
            "  messages: aiMessages as any,\n"
            "  temperature: 0.7,\n"
            "  experimental_transform: smoothStream({ delayInMs: 40, chunking: \"word\" }),\n"
            "})\n"
            "\n"
            "return result.toDataStreamResponse()"
        ),
        96,
        "Fungsi streamText() dari Vercel AI SDK mengeksekusi inferensi model AI secara streaming. Transformasi smoothStream() memberikan efek pengetikan alami bertahap per kata dengan jeda 40 milidetik, lalu mengembalikan aliran data respons HTTP ke komponen antarmuka pengguna."
    )

    add_screenshot_doc(
        "IV.1",
        "Antarmuka Fitur Tanya Jawab AI Chat pada Workspace Modul Pembelajaran",
        "Tangkapan layar antarmuka aktual aplikasi AiDen pada panel ruang kerja (Workspace). Terlihat antarmuka percakapan AI Chat interaktif berdampingan dengan penampil dokumen modul PDF, menampilkan respon asisten belajar Aiden beserta navigasi tab ringkasan, flashcard, kuis, dan catatan.",
        actual_image_path="public/ss.png"
    )

    add_h1("4.3.3 Implementasi Fitur Peringkasan Dokumen (Summary)")
    add_body(
        "Fitur Peringkasan Dokumen (Summary) diimplementasikan pada app/api/generate/summary/route.ts "
        "dan antarmuka components/features/summary/SummaryPanel.tsx. Fitur ini dirancang untuk membaca seluruh isi materi "
        "dokumen modul yang telah diindeks ke dalam basis data vektor, kemudian menyusun intisari materi secara terstruktur. Tahapannya meliputi:"
    )

    add_list_item("1. Penarikan Seluruh Fragmen Dokumen", "Endpoint memanggil fungsi getAllWorkspaceChunks() untuk mengambil seluruh chunk materi yang tersimpan di tabel document_chunks, diurutkan berdasarkan chunk_index agar hierarki pembahasan tidak teracak.")
    add_list_item("2. Pemformatan Konteks Materi", "Potongan teks dirangkai dengan penanda [Bagian Dokumen #N] untuk memudahkan model AI memberikan rujukan sitasi bagian modul.")
    add_list_item("3. Generasi Ringkasan Terstruktur", "Model AI menyusun ringkasan dalam format terstandarisasi: Judul Materi, Konsep Utama (beserta nomor rujukan halaman/bagian), Penjelasan Detail, Konsep Penting, dan Rangkuman Penutup.")
    add_list_item("4. Penyimpanan dan Caching Hasil", "Hasil ringkasan disimpan ke tabel summaries di Supabase. Permintaan berikutnya akan mengambil ringkasan yang tersimpan dari basis data tanpa melakukan inferensi ulang, kecuali tombol 'Generate Ulang' ditekan.")
    add_list_item("5. Penyajian Antarmuka & Integrasi Catatan", "Ringkasan ditampilkan dalam format Markdown dengan tombol aksi cepat untuk menyalin teks atau menyimpannya langsung ke fitur Catatan.")

    add_code_block(
        "app/api/generate/summary/route.ts",
        "Baris 46–53",
        "Pengambilan Seluruh Fragmen Teks Dokumen Workspace Secara Terurut",
        (
            "// RAG Retrieval — Fetch document chunks from vector store for this workspace\n"
            "let contextText = \"\"\n"
            "const ragChunks = await getAllWorkspaceChunks(supabase, workspaceId)\n"
            "\n"
            "if (ragChunks.length > 0) {\n"
            "  contextText = formatChunksForPrompt(ragChunks)\n"
            "}"
        ),
        46,
        "Fungsi getAllWorkspaceChunks() mengambil seluruh potongan teks dokumen modul yang terkait dengan ID workspace aktif dari tabel document_chunks. Potongan teks tersebut diurutkan sesuai urutan aslinya, lalu diformat menggunakan formatChunksForPrompt() menjadi teks konteks komprehensif."
    )

    add_code_block(
        "app/api/generate/summary/route.ts",
        "Baris 128–135",
        "Pemanggilan Model AI untuk Menghasilkan Ringkasan Terstruktur",
        (
            "// Generate Summary via Gemini API\n"
            "const { text: summaryText } = await generateText({\n"
            "  model: google(CHAT_MODEL),\n"
            "  system: systemInstruction,\n"
            "  messages: promptMessages,\n"
            "  temperature: 0.3,\n"
            "  maxTokens: 8192,\n"
            "})"
        ),
        128,
        "Fungsi generateText() mengeksekusi inferensi model AI dengan parameter temperature: 0.3 agar keluaran ringkasan bersifat faktual, konsisten, dan terfokus pada materi. Batas token hingga 8.192 token dialokasikan untuk mengakomodasi ringkasan modul pembelajaran yang panjang."
    )

    add_code_block(
        "app/api/generate/summary/route.ts",
        "Baris 140–166",
        "Penyimpanan Hasil Ringkasan ke Tabel summaries pada Supabase",
        (
            "if (existingSummary) {\n"
            "  const { data: updated } = await supabase\n"
            "    .from(\"summaries\")\n"
            "    .update({\n"
            "      title: `Summary - ${workspaceTitle}`,\n"
            "      content: { text: summaryText },\n"
            "    })\n"
            "    .eq(\"id\", existingSummary.id)\n"
            "    .select().single()\n"
            "  savedSummary = updated\n"
            "} else {\n"
            "  const { data: inserted } = await supabase\n"
            "    .from(\"summaries\")\n"
            "    .insert({\n"
            "      workspace_id: workspaceId,\n"
            "      user_id: user.id,\n"
            "      title: `Summary - ${workspaceTitle}`,\n"
            "      content: { text: summaryText },\n"
            "    })\n"
            "    .select().single()\n"
            "  savedSummary = inserted\n"
            "}"
        ),
        140,
        "Hasil ringkasan teks disimpan ke tabel summaries menggunakan pola pembaruan (update) jika data ringkasan untuk workspace tersebut sudah ada sebelumnya, atau penambahan data baru (insert) jika belum pernah dibuat. Konten ringkasan disimpan dalam kolom bertipe JSONB untuk fleksibilitas struktur data."
    )

    add_screenshot_doc(
        "IV.2",
        "Antarmuka Fitur Peringkasan Dokumen (Summary) Berbasis Konteks RAG",
        "Menampilkan tab Summary pada workspace AiDen. Tampak hasil ringkasan terstruktur lengkap dengan Konsep Utama, Penjelasan Detail, rujukan halaman/bagian materi, serta tombol aksi Salin dan Simpan ke Catatan.",
        action_note="Buka Workspace pembelajaran aktif, klik tab 'Summary' di panel kanan, dan tangkap layar tampilan ringkasan materi yang telah digenerate."
    )

    add_h1("4.3.4 Implementasi Fitur Flashcard dan Kuis Interaktif")
    add_body(
        "Fitur Flashcard dan Kuis Interaktif berfungsi sebagai modul evaluasi belajar mandiri yang dirancang "
        "untuk menguji tingkat pemahaman dan mengingat kembali konsep-konsep kunci modul pembelajaran."
    )

    add_h2("A. Implementasi Fitur Flashcard Interaktif")
    add_body(
        "Fitur Flashcard diimplementasikan pada app/api/generate/flashcards/route.ts dan antarmuka "
        "components/features/flashcards/FlashcardPanel.tsx. Proses implementasi mencakup:"
    )

    add_list_item("1. Pengambilan Konteks Dokumen RAG", "Materi dasar pembuatan kartu ditarik dari potongan dokumen workspace menggunakan getAllWorkspaceChunks() agar pertanyaan bersumber langsung dari modul perkuliahan.")
    add_list_item("2. Generasi Struktur Kartu Berformat JSON", "Model AI diinstruksikan menyusun tepat 5 atau 10 kartu tanya-jawab dalam format JSON murni: {\"cards\": [{\"front\": \"pertanyaan\", \"back\": \"jawaban + rujukan halaman\"}]}.")
    add_list_item("3. Validasi dan Parsing JSON", "Server melakukan pembersihan tag Markdown dan memvalidasi kelengkapan bidang pertanyaan dan jawaban sebelum disimpan.")
    add_list_item("4. Penyimpanan dan Penyajian Interaktif", "Data kartu disimpan ke tabel flashcards kolom JSONB. Pada sisi antarmuka, kartu disajikan dengan efek animasi putar 3D (card flip), navigasi acak (shuffle), serta tombol penanda pemahaman (Mudah, Sedang, Sulit).")

    add_code_block(
        "app/api/generate/flashcards/route.ts",
        "Baris 66–79",
        "Instruksi Pembuatan Flashcard Terstruktur Berformat JSON dari Konteks Dokumen",
        (
            "const systemInstruction = `Kamu adalah Aiden, temen belajar yang gaul dan pinter. ` +\n"
            "  `Tugasmu bikin flashcard dari konteks materi dokumen yang disediakan.\\n\\n` +\n"
            "  `PENTING: Output HANYA berupa JSON valid. TANPA markdown, TANPA backtick. Langsung JSON mentah.\\n\\n` +\n"
            "  `Format JSON yang WAJIB diikuti:\\n` +\n"
            "  `{\"cards\":[{\"front\":\"pertanyaan singkat\",\"back\":\"jawaban singkat 1-2 kalimat\"}]}\\n\\n` +\n"
            "  `ATURAN KETAT:\\n` +\n"
            "  `- Buat TEPAT ${count} flashcard — tidak boleh lebih, tidak boleh kurang\\n` +\n"
            "  `- Front: pertanyaan/soal singkat tentang konsep penting dari dokumen\\n` +\n"
            "  `- Back: jawaban singkat padat beserta rujukan bagian/halaman dokumen (misal: \"... (Hal. 2)\")\\n` +\n"
            "  `- HANYA dari isi konteks materi dokumen yang disediakan melalui sistem RAG`"
        ),
        66,
        "Potongan instruksi sistem ini menegaskan bahwa keluaran model AI harus berformat JSON valid tanpa pembungkus blok markdown tambahan. Setiap kartu wajib memiliki sisi depan (pertanyaan) dan sisi belakang (jawaban ringkas beserta rujukan halaman modul)."
    )

    add_code_block(
        "app/api/generate/flashcards/route.ts",
        "Baris 146–172",
        "Penyimpanan Kumpulan Flashcard ke Tabel flashcards pada Supabase",
        (
            "if (existing) {\n"
            "  const { data: updated } = await supabase\n"
            "    .from(\"flashcards\")\n"
            "    .update({\n"
            "      title: `Flashcard - ${workspaceTitle}`,\n"
            "      content: { cards, cardCount: count },\n"
            "    })\n"
            "    .eq(\"id\", existing.id)\n"
            "    .select().single()\n"
            "  savedFlashcard = updated\n"
            "} else {\n"
            "  const { data: inserted } = await supabase\n"
            "    .from(\"flashcards\")\n"
            "    .insert({\n"
            "      workspace_id: workspaceId,\n"
            "      user_id: user.id,\n"
            "      title: `Flashcard - ${workspaceTitle}`,\n"
            "      content: { cards, cardCount: count },\n"
            "    })\n"
            "    .select().single()\n"
            "  savedFlashcard = inserted\n"
            "}"
        ),
        146,
        "Kumpulan kartu flashcard yang telah divalidasi disimpan ke tabel flashcards pada kolom JSONB content. Pola upsert memastikan data kartu yang diperbarui tersimpan tanpa duplikasi entri dalam satu ruang kerja."
    )

    add_screenshot_doc(
        "IV.3",
        "Antarmuka Fitur Flashcard Belajar Interaktif 3D Card-Flip",
        "Menampilkan antarmuka kartu flashcard interaktif pada workspace AiDen. Tampak bagian kartu pertanyaan dan jawaban dengan animasi balik kartu 3D, kontrol navigasi, serta opsi penilaian tingkat pemahaman.",
        action_note="Navigasikan ke tab 'Flashcard' pada workspace pembelajaran, buka salah satu kartu untuk memperlihatkan animasi flip, dan ambil screenshot antarmuka."
    )

    add_h2("B. Implementasi Fitur Kuis Interaktif Pilihan Ganda")
    add_body(
        "Fitur Kuis Interaktif diimplementasikan pada app/api/generate/quiz/route.ts, "
        "app/api/quiz/submit-attempt/route.ts, dan components/features/quiz/QuizPanel.tsx. "
        "Mekanisme teknis fitur ini mencakup:"
    )

    add_list_item("1. Pengambilan Konteks Materi RAG", "Seluruh butir soal kuis dibuat berdasarkan konteks modul materi yang ditarik menggunakan modul getAllWorkspaceChunks().")
    add_list_item("2. Generasi Soal dan Kunci Berformat JSON", "AI menghasilkan soal pilihan ganda lengkap dengan 4 opsi pilihan, indeks kunci jawaban benar (0-3), pembahasan logis, dan rujukan nomor halaman (pageRef).")
    add_list_item("3. Pengerjaan Soal dan Validasi Jawaban", "Komponen antarmuka memfasilitasi pengguna memilih opsi jawaban per butir soal, melacak navigasi soal yang sudah dijawab, serta menghitung skor akhir secara otomatis saat kuis diselesaikan.")
    add_list_item("4. Pencatatan Riwayat Percobaan Kuis", "Hasil pengerjaan (skor persentase, jumlah benar, dan rincian jawaban pengguna) dikirim ke API /api/quiz/submit-attempt untuk disimpan ke dalam array attempts pada tabel quizzes dan dicatat ke activity_logs.")

    add_code_block(
        "app/api/generate/quiz/route.ts",
        "Baris 69–80",
        "Struktur Format JSON Soal Kuis Pilihan Ganda dengan Sitasi Halaman",
        (
            "Format JSON yang WAJIB diikuti:\n"
            "{\n"
            "  \"questions\": [\n"
            "    {\n"
            "      \"id\": 1,\n"
            "      \"question\": \"teks pertanyaan...\",\n"
            "      \"options\": [\"pilihan A\", \"pilihan B\", \"pilihan C\", \"pilihan D\"],\n"
            "      \"answerIndex\": 0,\n"
            "      \"explanation\": \"Penjelasan AI ringkas dan jelas mengapa jawaban tersebut benar...\",\n"
            "      \"pageRef\": \"Hal. 2\"\n"
            "    }\n"
            "  ]\n"
            "}"
        ),
        69,
        "Spesifikasi format JSON untuk kuis mengharuskan model AI menyertakan teks pertanyaan, 4 opsi pilihan jawaban, indeks jawaban benar (answerIndex bernilai 0 hingga 3), penjelasan ilmiah mengenai alasan jawaban benar, serta rujukan halaman modul materi (pageRef)."
    )

    add_code_block(
        "app/api/quiz/submit-attempt/route.ts",
        "Baris 33–55",
        "Pencatatan Riwayat Percobaan Pengerjaan Kuis dan Skor Nilai Pengguna",
        (
            "const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`\n"
            "const newAttempt = {\n"
            "  attempt_id: attemptId,\n"
            "  created_at: new Date().toISOString(),\n"
            "  score_percentage: scorePercentage,\n"
            "  correct_count: correctCount,\n"
            "  total_count: totalCount,\n"
            "  user_answers: userAnswers,\n"
            "}\n"
            "\n"
            "const updatedAttempts = [newAttempt, ...attempts]\n"
            "\n"
            "const { data: updatedQuiz } = await supabase\n"
            "  .from(\"quizzes\")\n"
            "  .update({\n"
            "    content: {\n"
            "      ...content,\n"
            "      attempts: updatedAttempts,\n"
            "    },\n"
            "  })\n"
            "  .eq(\"id\", quiz.id)\n"
            "  .select().single()"
        ),
        33,
        "Saat pengguna menyelesaikan kuis, API menyusun objek rekaman percobaan (attempt) yang mencakup identitas percobaan unik, waktu pengerjaan, persentase nilai, jumlah jawaban benar, dan daftar opsi yang dipilih. Objek ini kemudian ditambahkan ke riwayat percobaan kuis pada tabel quizzes."
    )

    add_screenshot_doc(
        "IV.4",
        "Antarmuka Fitur Kuis Pilihan Ganda dan Hasil Evaluasi Jawaban",
        "Menampilkan antarmuka pengerjaan kuis pilihan ganda pada workspace AiDen. Terlihat daftar butir pertanyaan, pilihan opsi jawaban, nomor soal aktif, dan tampilan evaluasi hasil skor beserta pembahasan jawaban.",
        action_note="Navigasikan ke tab 'Quiz' pada workspace, selesaikan pengerjaan kuis untuk menampilkan ringkasan skor dan pembahasan jawaban, lalu ambil tangkapan layar."
    )

    add_h1("4.3.5 Implementasi Fitur Catatan dan Riwayat Pembelajaran")
    add_body(
        "Fitur Catatan (Notes) dan Riwayat Pembelajaran (Activity History) berfungsi sebagai "
        "alat manajemen belajar mandiri pengguna di dalam ekosistem aplikasi AiDen."
    )

    add_h2("A. Implementasi Fitur Catatan Pembelajaran (Notes)")
    add_body(
        "Fitur Catatan diimplementasikan melalui API route app/api/notes/route.ts, "
        "endpoint integrasi ringkasan app/api/summary/save-note/route.ts, dan antarmuka "
        "components/features/notes/notes-client.tsx. Fitur ini memungkinkan pengguna membuat catatan mandiri, "
        "mengedit isi catatan, menghapus catatan dengan dialog konfirmasi SweetAlert2, serta menyimpan intisari hasil ringkasan materi ke dalam catatan secara instan."
    )

    add_code_block(
        "app/api/notes/route.ts",
        "Baris 58–73",
        "Operasi Pembuatan Catatan Baru dan Penyimpanan ke Tabel notes",
        (
            "const insertPayload: any = {\n"
            "  user_id: user.id,\n"
            "  workspace_id: targetWorkspaceId,\n"
            "  title,\n"
            "  content,\n"
            "}\n"
            "if (category) {\n"
            "  insertPayload.category = category\n"
            "}\n"
            "\n"
            "const { data: newNote, error: insertError } = await supabase\n"
            "  .from(\"notes\")\n"
            "  .insert(insertPayload)\n"
            "  .select()\n"
            "  .single()"
        ),
        58,
        "Potongan kode di atas menangani pembuatan catatan baru dengan mengaitkan identitas pengguna (user_id) dan ID ruang kerja aktif (targetWorkspaceId). Judul, isi teks, dan kategori catatan disimpan ke dalam tabel notes di Supabase."
    )

    add_code_block(
        "app/api/summary/save-note/route.ts",
        "Baris 19–33",
        "Integrasi Penyimpanan Hasil Ringkasan RAG ke Dalam Fitur Catatan",
        (
            "const insertPayload: any = {\n"
            "  workspace_id: workspaceId,\n"
            "  user_id: user.id,\n"
            "  title: title || \"Ringkasan Materi\",\n"
            "  content: content,\n"
            "  category: \"Summary\",\n"
            "}\n"
            "\n"
            "const { data: insertedData, error: insertError } = await supabase\n"
            "  .from(\"notes\")\n"
            "  .insert(insertPayload)\n"
            "  .select()\n"
            "  .single()"
        ),
        19,
        "Endpoint ini memungkinkan hasil generasi ringkasan materi dari tab Summary disimpan langsung menjadi dokumen catatan pengguna dengan kategori khusus 'Summary', sehingga pengguna dapat mengedit atau membaca kembali intisari materi di halaman Catatan."
    )

    add_screenshot_doc(
        "IV.5",
        "Antarmuka Fitur Manajemen Catatan Pembelajaran (Notes)",
        "Menampilkan halaman manajemen catatan belajar pengguna yang menyajikan daftar kartu catatan, kolom pencarian, filter kategori materi, serta tombol aksi untuk menambah, mengedit, melihat pratinjau, dan menghapus catatan.",
        action_note="Buka menu navigasi utama 'Catatan' (/notes) pada aplikasi AiDen dan ambil tangkapan layar daftar catatan pembelajaran yang tersimpan."
    )

    add_h2("B. Implementasi Fitur Riwayat Pembelajaran (Activity History)")
    add_body(
        "Fitur Riwayat Pembelajaran diimplementasikan melalui API route app/api/history/route.ts "
        "dan komponen antarmuka components/features/history/history-card.tsx. Sistem secara otomatis "
        "mencatat setiap aksi belajar yang dilakukan pengguna ke dalam tabel activity_logs. "
        "Aktivitas yang dicatat mencakup pembuatan workspace, interaksi tanya-jawab AI Chat, pembuatan ringkasan, "
        "generasi flashcard, pembuatan kuis, pengerjaan kuis beserta nilai skor, dan pembuatan catatan."
    )

    add_code_block(
        "app/api/notes/route.ts",
        "Baris 110–120",
        "Pencatatan Otomatis Log Aktivitas Pengguna ke Tabel activity_logs",
        (
            "await supabase.from(\"activity_logs\").insert({\n"
            "  user_id: user.id,\n"
            "  workspace_id: workspaceId || null,\n"
            "  action_type: \"CREATE_NOTE\",\n"
            "  details: {\n"
            "    title,\n"
            "    target_url: \"/notes\",\n"
            "    note_id: newNote.id,\n"
            "  },\n"
            "})"
        ),
        110,
        "Setiap kali terjadi aksi penting (seperti pembuatan catatan), sistem mengeksekusi penyisipan data ke tabel activity_logs dengan menyimpan tipe aksi (CREATE_NOTE) dan objek rincian metadata (details) berupa judul, tautan navigasi balik, serta ID entitas terkait."
    )

    add_code_block(
        "components/features/history/history-card.tsx",
        "Baris 48–61",
        "Pemetaan Konfigurasi Visual dan Deskripsi Riwayat Aktivitas Pembelajaran",
        (
            "GENERATE_FLASHCARD: {\n"
            "  label: \"Flashcard\",\n"
            "  icon: BrainCircuit,\n"
            "  color: \"text-emerald-500\",\n"
            "  bgClass: \"bg-emerald-500/10\",\n"
            "  badgeClass: \"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20\",\n"
            "  getDescription: (log) => {\n"
            "    const title = log.details?.title ?? log.workspaces?.title ?? \"dokumen\"\n"
            "    const count = log.details?.cardCount\n"
            "    return count\n"
            "      ? `Membuat ${count} flashcard dari \"${title}\"`\n"
            "      : `Membuat flashcard dari \"${title}\"`\n"
            "  },\n"
            "},"
        ),
        48,
        "Pada sisi antarmuka, objek konfigurasi ACTION_CONFIG memetakan setiap tipe aksi log menjadi ikon visual, warna badge tematik, dan teks deskripsi dinamis berbahasa Indonesia sehingga riwayat aktivitas pengguna dapat dibaca secara informatif."
    )

    add_screenshot_doc(
        "IV.6",
        "Antarmuka Riwayat Aktivitas Pembelajaran Pengguna (Activity History)",
        "Menampilkan halaman linimasa riwayat pembelajaran pengguna pada aplikasi AiDen. Terlihat pencatatan kronologis aktivitas pengerjaan kuis, pembuatan flashcard, chat AI, dan ringkasan lengkap dengan filter kategori dan tautan kembali ke materi.",
        action_note="Buka menu navigasi utama 'Riwayat' (/history) pada aplikasi AiDen dan ambil tangkapan layar linimasa aktivitas belajar yang tercatat."
    )

    add_h1("Dokumentasi Implementasi Basis Data (Database Implementation)")
    add_body(
        "Aplikasi AiDen menggunakan basis data relasional PostgreSQL yang dikelola melalui platform Supabase. "
        "Untuk mendukung penyimpanan representasi numerik dokumen pembelajaran dan pencarian kemiripan semantik, "
        "diaktifkan ekstensi vector (pgvector). Keamanan akses data antar pengguna dijamin melalui penerapan "
        "kebijakan Row Level Security (RLS) pada seluruh entitas tabel. Berikut adalah struktur dokumentasi tabel basis data aktual yang digunakan oleh aplikasi:"
    )

    # Database Table in DOCX
    db_rows = [
        ("Nama Tabel", "Kolom Utama & Tipe Data", "Relasi (Foreign Key)", "Fungsi dalam Implementasi & RAG"),
        ("users", "id (UUID, PK)\nfull_name (TEXT)\navatar_url (TEXT)\nrole (TEXT)\ncreated_at (TIMESTAMPTZ)", "auth.users.id (CASCADE)", "Menyimpan data profil pengguna terverifikasi yang diperluas dari sistem autentikasi Supabase."),
        ("workspaces", "id (UUID, PK)\nuser_id (UUID, FK)\ntitle (TEXT)\ndescription (TEXT)\ncreated_at (TIMESTAMPTZ)", "users.id (CASCADE)", "Ruang belajar utama pengguna yang mengelompokkan dokumen materi, ringkasan, flashcard, dan kuis."),
        ("documents", "id (UUID, PK)\nworkspace_id (UUID, FK)\nuser_id (UUID, FK)\nname (TEXT)\nstorage_path (TEXT)\nstatus (TEXT)\nerror_message (TEXT)", "workspaces.id\nusers.id", "Menyimpan metadata file PDF modul pembelajaran yang diunggah ke Storage bucket serta status proses pemrosesan ('pending', 'processing', 'completed', 'failed')."),
        ("document_chunks", "id (UUID, PK)\ndocument_id (UUID, FK)\nworkspace_id (UUID, FK)\ncontent (TEXT)\nembedding (VECTOR 3072)\nmetadata (JSONB)\ncreated_at (TIMESTAMPTZ)", "documents.id\nworkspaces.id", "Entitas Inti RAG: Menyimpan pecahan teks modul (chunk) dan vektor dense 3.072 dimensi dari model gemini-embedding-001 dengan indeks akselerasi HNSW."),
        ("summaries", "id (UUID, PK)\nworkspace_id (UUID, FK)\nuser_id (UUID, FK)\ntitle (TEXT)\ncontent (JSONB)\ncreated_at (TIMESTAMPTZ)", "workspaces.id\nusers.id", "Menyimpan intisari materi terstruktur hasil generasi AI berbasis seluruh chunk dokumen modul."),
        ("flashcards", "id (UUID, PK)\nworkspace_id (UUID, FK)\nuser_id (UUID, FK)\ntitle (TEXT)\ncontent (JSONB)\ncreated_at (TIMESTAMPTZ)", "workspaces.id\nusers.id", "Menyimpan kumpulan kartu tanya-jawab ringkas berbasis materi dokumen modul dalam format JSONB."),
        ("quizzes", "id (UUID, PK)\nworkspace_id (UUID, FK)\nuser_id (UUID, FK)\ntitle (TEXT)\ncontent (JSONB)\ncreated_at (TIMESTAMPTZ)", "workspaces.id\nusers.id", "Menyimpan butir soal pilihan ganda, kunci jawaban, pembahasan, serta riwayat percobaan pengerjaan pengguna (attempts)."),
        ("notes", "id (UUID, PK)\nworkspace_id (UUID, FK)\nuser_id (UUID, FK)\ntitle (TEXT)\ncontent (TEXT)\ncategory (TEXT)\ncreated_at (TIMESTAMPTZ)\nupdated_at (TIMESTAMPTZ)", "workspaces.id\nusers.id", "Menyimpan catatan belajar mandiri pengguna baik yang ditulis langsung maupun diekspor dari hasil ringkasan materi."),
        ("chats", "id (UUID, PK)\nuser_id (UUID, FK)\nworkspace_id (UUID, FK)\ntitle (TEXT)\ncreated_at (TIMESTAMPTZ)", "users.id\nworkspaces.id", "Mengelola sesi percakapan asisten belajar yang terikat dengan ruang kerja pengguna."),
        ("messages", "id (UUID, PK)\nchat_id (UUID, FK)\nrole (TEXT)\ncontent (TEXT)\ncreated_at (TIMESTAMPTZ)", "chats.id", "Menyimpan pesan percakapan individual baik dari sisi pengguna ('user') maupun asisten ('assistant')."),
        ("notifications", "id (UUID, PK)\nuser_id (UUID, FK)\ntitle (TEXT)\nmessage (TEXT)\nis_read (BOOLEAN)\ncreated_at (TIMESTAMPTZ)", "users.id", "Menyimpan pemberitahuan sistem kepada pengguna terkait proses pemrosesan modul, ringkasan, atau kuis yang telah selesai."),
        ("activity_logs", "id (UUID, PK)\nuser_id (UUID, FK)\nworkspace_id (UUID, FK)\naction_type (TEXT)\ndetails (JSONB)\ncreated_at (TIMESTAMPTZ)", "users.id\nworkspaces.id", "Menyimpan rekaman audit aktivitas belajar pengguna untuk disajikan pada halaman linimasa riwayat pembelajaran.")
    ]

    t_db = doc.add_table(rows=len(db_rows), cols=4)
    t_db.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_db.autofit = False
    col_widths = [Inches(1.1), Inches(1.6), Inches(1.2), Inches(2.4)]

    for r_idx, row_data in enumerate(db_rows):
        row = t_db.rows[r_idx]
        for c_idx, text_val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.05
            
            if r_idx == 0:
                shd = parse_xml(r'<w:shd {} w:fill="0F172A"/>'.format(nsdecls('w')))
                cell._tc.get_or_add_tcPr().append(shd)
                run = p.add_run(text_val)
                run.bold = True
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
            else:
                shd_color = "FFFFFF" if r_idx % 2 == 1 else "F8FAFC"
                shd = parse_xml(r'<w:shd {} w:fill="{}"/>'.format(nsdecls('w'), shd_color))
                cell._tc.get_or_add_tcPr().append(shd)
                run = p.add_run(text_val)
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_tbl_cap = doc.add_paragraph()
    p_tbl_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tbl_cap.paragraph_format.space_before = Pt(4)
    r_cap = p_tbl_cap.add_run("Tabel IV.1: Dokumentasi Struktur Entitas Basis Data Aktual Aplikasi AiDen")
    r_cap.italic = True
    r_cap.font.size = Pt(9.5)

    doc.save(output_docx_path)
    print(f"DOCX successfully generated at: {output_docx_path}")


if __name__ == "__main__":
    out_dir = r"c:\Users\adent\Desktop\NEXT-JS\aidenv2\docs"
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "development-revised.pdf")
    docx_path = os.path.join(out_dir, "Bab_IV_4.3_Development_AiDen.docx")
    
    generate_pdf(pdf_path)
    generate_docx(docx_path)

