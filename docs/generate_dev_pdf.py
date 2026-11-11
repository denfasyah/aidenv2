# -*- coding: utf-8 -*-
"""
Script Generator PDF Dokumentasi Bab IV Bagian 4.3 Development AiDen
Skripsi Program Studi Rekayasa Perangkat Lunak - Universitas Bina Sarana Informatika (UBSI)
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

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
        self.line(3.0 * cm, 2.2 * cm, 18.5 * cm, 2.2 * cm)

        footer_text_left = "Program Studi Rekayasa Perangkat Lunak — Universitas Bina Sarana Informatika"
        page_str = f"Halaman {self._pageNumber} dari {num_pages}"
        self.drawString(3.0 * cm, 1.7 * cm, footer_text_left)
        self.drawRightString(18.5 * cm, 1.7 * cm, page_str)

        self.restoreState()


def create_code_table(code_text, start_line, col_widths=[32, 408]):
    """
    Generates a stylized table with code line numbers and syntax styling.
    """
    lines = code_text.strip("\n").split("\n")
    data = []
    
    num_style = ParagraphStyle(
        "LineNumStyle",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#64748b"),
        alignment=2 # Right align
    )
    
    code_line_style = ParagraphStyle(
        "CodeLineStyle",
        fontName="Courier",
        fontSize=7.5,
        leading=9.5,
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
        fontSize=8,
        leading=11,
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


def build_screenshot_box(fig_num, fig_title, desc_text):
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
    placeholder_style = ParagraphStyle(
        "PlaceholderText",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#0284c7"),
        alignment=1
    )

    content = [
        [Paragraph(f"[TAMPILAN SCREENSHOT APLIKASI AKTUAL: {fig_title.upper()}]<br/><font size=7.5 color='#64748b'>Rujukan URL Antarmuka: Workspace Aiden Active View</font>", placeholder_style)],
    ]
    t = Table(content, colWidths=[440], rowHeights=[90])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#86efac")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    caption = Paragraph(f"<b>Gambar {fig_num}.</b> {fig_title}", caption_style)
    desc = Paragraph(f"<i>Keterangan:</i> {desc_text}", desc_style)
    return [t, Spacer(1, 4), caption, Spacer(1, 3), desc]


def generate_development_pdf(output_pdf_path):
    # Setup document
    # Margins: Left 3cm, Right 2.5cm, Top 2.8cm, Bottom 2.5cm
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        leftMargin=3.0 * cm,
        rightMargin=2.5 * cm,
        topMargin=2.8 * cm,
        bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom academic styles
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
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "SubSectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
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
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
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
        "(<i>Analysis, Design, Development, Implementation, Evaluation</i>). Pada tahap ini, seluruh cetak biru, rancangan antarmuka, "
        "arsitektur alur data, dan rancangan model yang telah disusun pada tahap sebelumnya diwujudkan secara nyata menjadi "
        "sebuah sistem perangkat lunak yang fungsional. Dalam konteks aplikasi AiDen (<i>AI Learning Assistant</i>), "
        "tahap <i>Development</i> berfokus pada konstruksi kode program terintegrasi yang mencakup implementasi "
        "arsitektur <i>Retrieval-Augmented Generation</i> (RAG), pembangunan fitur-fitur pembelajaran interaktif "
        "(Tanya Jawab AI, Peringkasan Dokumen, Flashcard, dan Kuis Pilihan Ganda), konfigurasi basis data relasional bervektor "
        "pada Supabase PostgreSQL, serta pengembangan antarmuka pengguna berbasis <i>Next.js 15 App Router</i>.",
        body_style
    ))
    story.append(Paragraph(
        "Pencapaian utama pada tahap <i>Development</i> ini adalah keberhasilan penerapan pipeline RAG yang konsisten "
        "di seluruh fitur pembelajaran. Seluruh fitur utama tidak lagi mengandalkan pengetahuan umum model AI "
        "(<i>parametric memory</i>) semata, melainkan selalu berakar pada materi dokumen modul PDF yang diunggah "
        "oleh pengguna (<i>external knowledge retrieval</i>). Dengan demikian, risiko halusinasi informasi dapat diminimalisasi "
        "dan integritas materi akademis tetap terjaga.",
        body_style
    ))

    story.append(Spacer(1, 6))

    # 4.3.1 Implementasi RAG
    story.append(Paragraph("4.3.1 Implementasi RAG (Retrieval-Augmented Generation)", h1_style))
    story.append(Paragraph(
        "Pipeline <i>Retrieval-Augmented Generation</i> (RAG) pada AiDen dibangun sebagai fondasi utama "
        "penyedia konteks faktual dokumen pembelajaran. Proses RAG berjalan secara sistematis melalui 8 (delapan) tahapan utama:",
        body_style
    ))

    rag_steps = [
        "<b>1. Penerimaan & Penyimpanan Dokumen PDF:</b> Dokumen PDF diunggah melalui formulir pembuatan workspace pada file <code>app/(main)/workspaces/actions.ts</code>. Dokumen disimpan pada Supabase Storage bucket <code>materials</code> dengan isolasi path <code>{user_id}/{workspace_id}/{filename}</code>.",
        "<b>2. Ekstraksi Teks Asli:</b> Server mengeksekusi fungsi <code>processDocument()</code> pada <code>utils/rag/processor.ts</code>. Teks mentah diekstraksi dari buffer biner PDF menggunakan pustaka <code>pdf-parse</code> secara komprehensif.",
        "<b>3. Text Chunking & Overlapping:</b> Teks dokumen dipecah menjadi potongan-potongan terstruktur berukuran rata-rata 1.200 karakter dengan <i>overlap</i> 200 karakter. Pemotongan dirancang adaptif mengikuti batas perpindahan baris (<i>newline boundary</i>) agar makna kalimat tidak terpotong sembarangan.",
        "<b>4. Batched Vector Embedding:</b> Setiap chunk teks dikonversi menjadi vektor numerik dense berdimensi 3.072 menggunakan model <code>gemini-embedding-001</code> melalui pustaka resmi AI SDK Google (<code>@ai-sdk/google</code>). Proses embedding dieksekusi dalam batch berisi 20 chunk guna menjaga efisiensi serta menghindari batasan <i>rate limit</i> API.",
        "<b>5. Penyimpanan Vektor & Metadata ke Supabase:</b> Vektor embedding disimpan ke dalam tabel <code>document_chunks</code> pada basis data PostgreSQL Supabase yang telah dilengkapi ekstensi <code>pgvector</code>. Metadata mencakup nomor urut chunk (<code>chunk_index</code>), total potongan (<code>total_chunks</code>), identitas dokumen, serta relasi workspace.",
        "<b>6. Akselerasi HNSW Index:</b> Tabel <code>document_chunks</code> dioptimasi menggunakan indeks vektor <i>Hierarchical Navigable Small World</i> (HNSW) berbasis operator <code>vector_cosine_ops</code> untuk pencarian tetangga terdekat berkecepatan tinggi.",
        "<b>7. Semantic Search via Database RPC:</b> Pencarian kesamaan semantik dieksekusi melalui fungsi <i>Stored Procedure</i> PostgreSQL <code>match_document_chunks()</code> yang menghitung <i>cosine similarity</i> antara embedding pertanyaan dengan vektor dokumen berstatus 'completed'.",
        "<b>8. Modul Terpadu RAG Retriever:</b> Modul terpusat <code>lib/ai/rag-retriever.ts</code> menyediakan fungsi <code>retrieveRelevantChunks()</code> untuk pencarian semantik terfokus dan <code>getAllWorkspaceChunks()</code> untuk perolehan menyeluruh pada fitur ringkasan dokumen."
    ]
    for step in rag_steps:
        story.append(Paragraph(step, list_item_style))

    story.append(Spacer(1, 6))

    # Code Snippet 1
    story.append(build_meta_box(
        "utils/rag/processor.ts",
        "Baris 10–26 & 67–87",
        "Fungsi Chunking Teks Adaptif dan Batched Embedding Dokumen"
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
        "}\n"
        "// Batching embedding 20 chunks per request via gemini-embedding-001\n"
        "const BATCH_SIZE = 20\n"
        "const allEmbeddings: number[][] = []\n"
        "for (let b = 0; b < chunks.length; b += BATCH_SIZE) {\n"
        "  const batch = chunks.slice(b, b + BATCH_SIZE)\n"
        "  const { embeddings } = await embedMany({\n"
        "    model: google.textEmbeddingModel(EMBEDDING_MODEL, {\n"
        "      outputDimensionality: EMBEDDING_DIMENSIONS, // 3072 dims\n"
        "    }),\n"
        "    values: batch,\n"
        "  })\n"
        "  allEmbeddings.push(...embeddings)\n"
        "}"
    )
    story.append(create_code_table(code_chunking, 10))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi <code>chunkText()</code> memastikan pemisahan dokumen menjadi fragmen 1.200 karakter dengan tumpang tindih (<i>overlap</i>) 200 karakter tanpa memutus kalimat di tengah baris. Selanjutnya, <code>embedMany()</code> memproses vektor embedding secara efisien dalam kelompok 20 bagian untuk disimpan ke tabel <code>document_chunks</code>.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Code Snippet 2: match_document_chunks RPC
    story.append(build_meta_box(
        "rag-migration.sql",
        "Baris 113–145",
        "Fungsi PostgreSQL RPC match_document_chunks untuk Semantic Similarity Search"
    ))
    code_rpc = (
        "CREATE OR REPLACE FUNCTION match_document_chunks(\n"
        "  query_embedding extensions.vector(3072),\n"
        "  match_count      int DEFAULT 5,\n"
        "  filter_workspace_id uuid DEFAULT NULL,\n"
        "  filter_user_id   uuid DEFAULT NULL\n"
        ")\n"
        "RETURNS TABLE (id uuid, document_id uuid, content text, metadata jsonb, similarity float)\n"
        "LANGUAGE sql STABLE SECURITY DEFINER AS $$\n"
        "  SELECT dc.id, dc.document_id, dc.content, dc.metadata,\n"
        "    1 - (dc.embedding <=> query_embedding) AS similarity\n"
        "  FROM document_chunks dc\n"
        "  JOIN documents d ON d.id = dc.document_id\n"
        "  WHERE (filter_workspace_id IS NULL OR dc.workspace_id = filter_workspace_id)\n"
        "    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)\n"
        "    AND d.status = 'completed'\n"
        "  ORDER BY dc.embedding <=> query_embedding\n"
        "  LIMIT match_count;\n"
        "$$;"
    )
    story.append(create_code_table(code_rpc, 113))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Fungsi RPC ini memanfaatkan operator jarak kosinus (<code>&lt;=&gt;</code>) dari ekstensi <code>pgvector</code>. Fungsi secara ketat memfilter data berdasarkan <code>filter_workspace_id</code> dan <code>filter_user_id</code> sehingga data materi antar pengguna terisolasi dengan aman.",
        body_no_indent
    ))

    story.append(Spacer(1, 10))

    # 4.3.2 Implementasi Fitur Tanya Jawab dan Rujukan Sumber
    story.append(Paragraph("4.3.2 Implementasi Fitur Tanya Jawab dan Rujukan Sumber", h1_style))
    story.append(Paragraph(
        "Fitur Tanya Jawab (<i>AI Chat</i>) diimplementasikan pada komponen antarmuka <code>AIChatPanel.tsx</code> "
        "dan API route <code>app/api/chat/route.ts</code>. Fitur ini memungkinkan pengguna berinteraksi langsung "
        "dengan Aiden mengenai materi dokumen yang sedang aktif. Mekanisme operasional fitur mencakup:",
        body_style
    ))

    chat_mechanisms = [
        "<b>1. Pengiriman Pertanyaan Pengguna:</b> Pengguna mengetik pertanyaan pada input chat atau memilih tombol saran cepat (<i>prompt suggestions</i>). State pesan dikelola secara reaktif melalui hook <code>useChat()</code> dari paket <code>ai/react</code>.",
        "<b>2. Vektor Pertanyaan & Semantic Retrieval:</b> Saat pesan masuk ke server API, pertanyaan terakhir dikonversi menjadi embedding vektor lalu diserahkan kepada fungsi <code>retrieveRelevantChunks()</code> untuk menarik 5 potongan teks paling relevan dari database.",
        "<b>3. Pembangunan Prompt Teraugmentasi:</b> Konteks dokumen disisipkan secara tegas ke dalam <i>System Prompt</i> dengan instruksi ketat: model hanya diperkenankan menjawab berdasarkan fakta yang tertulis pada teks konteks dan dilarang mengarang.",
        "<b>4. Generasi Streaming Berkecepatan Tinggi:</b> Jawaban dihasilkan melalui model <code>gemini-2.5-flash</code> menggunakan <code>streamText()</code> dan <code>smoothStream()</code> untuk menghadirkan efek pengetikan alami kata-demi-kata (<i>word chunking</i>).",
        "<b>5. Penyajian Rujukan Halaman & Sitasi:</b> Format jawaban diwajibkan menyertakan sitasi halaman materi (contoh: <code>(Hal. 3)</code> atau <code>[Bagian Dokumen #2]</code>).",
        "<b>6. Persistensi & Logging Riwayat:</b> Pertanyaan pertama secara otomatis dicatat ke tabel <code>activity_logs</code> dengan tipe aksi <code>ASSISTANT_CHAT</code>, dan seluruh pesan disimpan ke penyimpanan lokal per-workspace."
    ]
    for item in chat_mechanisms:
        story.append(Paragraph(item, list_item_style))

    story.append(Spacer(1, 6))

    # Code Snippet 3: Chat RAG
    story.append(build_meta_box(
        "app/api/chat/route.ts",
        "Baris 51–114",
        "Retrieval Relevan dan Injeksi Konteks RAG pada Endpoint Chat"
    ))
    code_chat = (
        "// 1. RAG Retrieval via reusable module\n"
        "const lastMessage = messages[messages.length - 1]\n"
        "let contextText = \"\"\n"
        "if (lastMessage?.role === \"user\" && lastMessage.content) {\n"
        "  const chunks = await retrieveRelevantChunks(supabase, {\n"
        "    workspaceId,\n"
        "    userId: user.id,\n"
        "    query: lastMessage.content,\n"
        "    matchCount: 5,\n"
        "  })\n"
        "  if (chunks && chunks.length > 0) {\n"
        "    contextText = chunks.map(c => c.content).join(\"\\n\\n---\\n\\n\")\n"
        "  }\n"
        "}\n"
        "// 2. Inject RAG context into system prompt\n"
        "let systemContent = buildSystemPrompt()\n"
        "if (contextText) {\n"
        "  systemContent +=\n"
        "    `\\n\\n[KONTEKS DOKUMEN — HASIL RETRIEVAL]\\n` +\n"
        "    `Berikut cuplikan materi paling relevan dengan pertanyaan user:\\n\\n` +\n"
        "    `${contextText}\\n\\n` +\n"
        "    `Aturan ketat:\\n` +\n"
        "    `- Jawab HANYA berdasarkan konteks di atas.\\n` +\n"
        "    `- Jika informasi tidak ada di konteks, katakan dengan jujur.\\n` +\n"
        "    `- Wajib sertakan rujukan halaman atau nomor bagian materi.`\n"
        "}\n"
        "// 3. Stream text response via Gemini Flash\n"
        "const result = streamText({\n"
        "  model: google(CHAT_MODEL),\n"
        "  system: systemContent,\n"
        "  messages: aiMessages as any,\n"
        "  temperature: 0.7,\n"
        "  experimental_transform: smoothStream({ delayInMs: 40, chunking: \"word\" }),\n"
        "})"
    )
    story.append(create_code_table(code_chat, 51))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Potongan kode di atas menunjukkan integrasi langsung antara fungsi <code>retrieveRelevantChunks()</code> dengan <i>prompt engineering</i> AiDen. Model AI secara eksplisit dikunci agar perilakunya konsisten dengan prinsip RAG tanpa kebocoran informasi di luar dokumen.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot Box AI Chat
    for flow in build_screenshot_box(
        "IV.1",
        "Antarmuka Fitur Tanya Jawab AI Chat dengan Rujukan Sumber Materi",
        "Menampilkan panel diskusi interaktif AI Chat pada tab workspace. Terlihat asisten Aiden memberikan penjelasan konsep materi lengkap dengan indikator sitasi rujukan sumber dokumen dan status 'Document Context Active'."
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # 4.3.3 Implementasi Fitur Peringkasan Dokumen
    story.append(Paragraph("4.3.3 Implementasi Fitur Peringkasan Dokumen (Summary)", h1_style))
    story.append(Paragraph(
        "Fitur Peringkasan Dokumen (<i>Summary</i>) dirancang untuk menyajikan intisari materi pembelajaran secara "
        "menyeluruh dan terstruktur. Berbeda dengan fitur tanya jawab yang memerlukan pencarian spesifik per kalimat, "
        "fitur ringkasan memerlukan pemahaman menyeluruh terhadap seluruh bab materi. Implementasi teknis fitur ini mencakup:",
        body_style
    ))

    summary_steps = [
        "<b>1. Strategi Sequential Full-Chunk Retrieval:</b> Endpoint <code>app/api/generate/summary/route.ts</code> memanggil fungsi <code>getAllWorkspaceChunks()</code> dari modul <code>lib/ai/rag-retriever.ts</code>. Seluruh fragmen teks dokumen yang tersimpan pada tabel <code>document_chunks</code> diambil dan diurutkan berdasarkan <code>metadata.chunk_index</code> agar susunan hierarki materi asli tidak teracak.",
        "<b>2. Konteks Terformat & Rujukan Bagian:</b> Melalui fungsi <code>formatChunksForPrompt()</code>, fragmen teks dirangkai dengan penanda <code>[Bagian Dokumen #N]</code> sebagai acuan rujukan halaman bagi model AI.",
        "<b>3. Generasi Terstruktur Markdown:</b> Model AI menyusun ringkasan dengan format standar: Judul Materi, Konsep Utama (disertai nomor rujukan), Penjelasan Detail, Konsep yang Perlu Diingat, dan Takeaway Penutup bergaya komunikatif.",
        "<b>4. Caching & Upsert Database:</b> Hasil ringkasan disimpan ke tabel <code>summaries</code> di Supabase. Apabila pengguna kembali ke workspace yang sama, ringkasan diambil langsung dari basis data tanpa mengulang proses inferensi AI, kecuali tombol 'Generate Ulang' ditekan.",
        "<b>5. Fitur Ekspor ke Catatan:</b> Antarmuka <code>SummaryPanel.tsx</code> menyediakan tombol satu-klik 'Simpan ke Catatan' yang secara otomatis menyalin teks ringkasan ke tabel <code>notes</code> pengguna."
    ]
    for s in summary_steps:
        story.append(Paragraph(s, list_item_style))

    story.append(Spacer(1, 6))

    # Code Snippet 4: Summary RAG Route
    story.append(build_meta_box(
        "app/api/generate/summary/route.ts",
        "Baris 45–125",
        "Pengambilan Seluruh Chunk Dokumen Terurut dan Generasi Ringkasan Terstruktur"
    ))
    code_summary = (
        "// 1. Ambil seluruh chunk dokumen yang sudah terindeks dari vector database\n"
        "let contextText = \"\"\n"
        "const ragChunks = await getAllWorkspaceChunks(supabase, workspaceId)\n"
        "if (ragChunks.length > 0) {\n"
        "  contextText = formatChunksForPrompt(ragChunks)\n"
        "}\n"
        "// 2. Susun prompt berkonteks RAG lengkap dengan aturan rujukan bagian/halaman\n"
        "const promptMessages: any[] = []\n"
        "if (contextText) {\n"
        "  promptMessages.push({\n"
        "    role: \"user\",\n"
        "    content: `Halo Aiden! Tolong buatkan ringkasan materi komprehensif dari seluruh isi ` +\n"
        "             `dokumen \"${workspaceTitle}\" berdasarkan konteks materi berikut:\\n\\n` +\n"
        "             `[KONTEKS DOKUMEN HASIL RETRIEVAL RAG]\\n${contextText}`,\n"
        "  })\n"
        "}\n"
        "// 3. Eksekusi generasi teks ringkasan dengan batas token hingga 8.192 token\n"
        "const { text: summaryText } = await generateText({\n"
        "  model: google(CHAT_MODEL),\n"
        "  system: systemInstruction,\n"
        "  messages: promptMessages,\n"
        "  temperature: 0.3,\n"
        "  maxTokens: 8192,\n"
        "})\n"
        "// 4. Simpan ke database Supabase tabel 'summaries' (Upsert pattern)\n"
        "if (existingSummary) {\n"
        "  await supabase.from(\"summaries\").update({ content: { text: summaryText } }).eq(\"id\", existingSummary.id)\n"
        "} else {\n"
        "  await supabase.from(\"summaries\").insert({ workspace_id: workspaceId, user_id: user.id, title: `Summary - ${workspaceTitle}`, content: { text: summaryText } })\n"
        "}"
    )
    story.append(create_code_table(code_summary, 45))
    story.append(Paragraph(
        "<i>Penjelasan Kode:</i> Potongan kode ini membuktikan bahwa ringkasan materi bersumber dari data vektor tabel <code>document_chunks</code> yang disusun secara berurutan, memastikan ringkasan mencakup seluruh materi dokumen dari awal hingga akhir.",
        body_no_indent
    ))

    story.append(Spacer(1, 6))

    # Screenshot Box Summary
    for flow in build_screenshot_box(
        "IV.2",
        "Antarmuka Fitur Ringkasan Materi (Summary) Berbasis Konteks RAG",
        "Menampilkan tab Summary pada workspace AiDen. Tampak hasil ringkasan terstruktur lengkap dengan Konsep Utama, Penjelasan Detail, rujukan halaman, serta tombol aksi 'Salin' dan 'Simpan ke Catatan'."
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # 4.3.4 Implementasi Fitur Flashcard dan Kuis Interaktif
    story.append(Paragraph("4.3.4 Implementasi Fitur Flashcard dan Kuis Interaktif", h1_style))
    story.append(Paragraph(
        "Fitur Flashcard dan Kuis Interaktif merupakan modul evaluasi mandiri yang dirancang untuk memperkuat daya ingat "
        "(<i>retention</i>) dan menguji pemahaman pengguna terhadap materi pembelajaran secara objektif.",
        body_style
    ))

    # A. Flashcard
    story.append(Paragraph("A. Implementasi Fitur Flashcard Interaktif", h2_style))
    story.append(Paragraph(
        "Fitur Flashcard diimplementasikan pada file <code>app/api/generate/flashcards/route.ts</code> dan antarmuka "
        "<code>components/features/flashcards/FlashcardPanel.tsx</code>. Karakteristik implementasinya meliputi:",
        body_style
    ))

    fc_points = [
        "<b>Pengambilan Konteks RAG:</b> Konteks materi ditarik dari potongan dokumen workspace menggunakan <code>getAllWorkspaceChunks()</code> untuk menjamin seluruh pertanyaan kartu diambil dari sumber dokumen yang valid.",
        "<b>Generasi Struktur JSON Terkontrol:</b> AI diinstruksikan menghasilkan format JSON murni: <code>{\"cards\": [{\"front\": \"pertanyaan\", \"back\": \"jawaban + rujukan halaman\"}]}</code> dengan pilihan jumlah 5 atau 10 kartu.",
        "<b>Penyimpanan Database & Sesi Interaktif:</b> Kumpulan kartu disimpan pada tabel <code>flashcards</code> kolom JSONB <code>content</code>. Status sesi (posisi kartu, acak/shuffle, kartu dibalik, reaksi pemahaman: mudah/sedang/sulit) dipertahankan pada <i>Local Storage</i> agar progres belajar pengguna tidak hilang saat berpindah tab."
    ]
    for p in fc_points:
        story.append(Paragraph(p, list_item_style))

    story.append(Spacer(1, 4))

    # Code Snippet 5: Flashcard Route
    story.append(build_meta_box(
        "app/api/generate/flashcards/route.ts",
        "Baris 41–98",
        "Generasi Kartu Flashcard Berformat JSON dari Konteks RAG"
    ))
    code_fc = (
        "// Ambil chunk dokumen materi sebagai basis flashcard\n"
        "const ragChunks = await getAllWorkspaceChunks(supabase, workspaceId)\n"
        "if (ragChunks.length > 0) contextText = formatChunksForPrompt(ragChunks)\n"
        "\n"
        "const systemInstruction = `Kamu adalah Aiden, temen belajar yang gaul dan pinter. ` +\n"
        "  `Tugasmu bikin flashcard dari konteks materi dokumen yang disediakan.\\n` +\n"
        "  `PENTING: Output HANYA berupa JSON valid format: ` +\n"
        "  `{\"cards\":[{\"front\":\"pertanyaan singkat\",\"back\":\"jawaban singkat + rujukan halaman\"}]}\\n` +\n"
        "  `ATURAN: Buat TEPAT ${count} flashcard. HANYA dari isi konteks materi dokumen RAG.`\n"
        "\n"
        "const { text } = await generateText({\n"
        "  model: google(CHAT_MODEL),\n"
        "  system: systemInstruction,\n"
        "  messages: [{ role: \"user\", content: `Buat flashcard dari konteks:\\n${contextText}` }],\n"
        "  temperature: 0.2,\n"
        "  maxTokens: 2000,\n"
        "})\n"
        "const parsed = JSON.parse(cleanedText)\n"
        "// Simpan ke Supabase tabel 'flashcards'\n"
        "await supabase.from(\"flashcards\").upsert({ workspace_id: workspaceId, user_id: user.id, content: { cards: parsed.cards } })"
    )
    story.append(create_code_table(code_fc, 41))

    story.append(Spacer(1, 6))

    # B. Quiz
    story.append(Paragraph("B. Implementasi Fitur Kuis Interaktif Pilihan Ganda", h2_style))
    story.append(Paragraph(
        "Fitur Kuis Interaktif diimplementasikan pada <code>app/api/generate/quiz/route.ts</code> dan antarmuka "
        "<code>components/features/quiz/QuizPanel.tsx</code>. Mekanisme implementasinya mencakup:",
        body_style
    ))

    quiz_points = [
        "<b>Konstruksi Butir Soal Terstandarisasi:</b> Soal kuis dibuat berdasarkan materi hasil retrieval RAG. Setiap soal terdiri atas: teks pertanyaan, 4 opsi jawaban (A, B, C, D), indeks kunci jawaban benar (0-3), teks penjelasan akademis alasan kebenaran jawaban, serta rujukan halaman dokumen (<code>pageRef</code>).",
        "<b>Sistem Penilaian & Riwayat Percobaan:</b> Saat kuis diselesaikan, sistem menghitung skor persentase secara otomatis dan menyimpan rekaman pengerjaan ke dalam array <code>attempts</code> pada tabel <code>quizzes</code> Supabase serta memicu log aktivitas <code>SUBMIT_QUIZ_ATTEMPT</code>.",
        "<b>Evaluasi Mandiri Komprehensif:</b> Pada fase hasil (<i>result phase</i>), pengguna dapat meninjau kembali setiap butir soal untuk melihat jawaban yang dipilih, kunci jawaban yang benar, rujukan halaman buku materi, dan pembahasan mendalam."
    ]
    for q in quiz_points:
        story.append(Paragraph(q, list_item_style))

    story.append(Spacer(1, 4))

    # Code Snippet 6: Quiz Route
    story.append(build_meta_box(
        "app/api/generate/quiz/route.ts",
        "Baris 40–109",
        "Konstruksi Soal Kuis Pilihan Ganda Berbasis RAG dengan Sitasi Halaman"
    ))
    code_quiz = (
        "// Ambil chunk dokumen via RAG\n"
        "const ragChunks = await getAllWorkspaceChunks(supabase, workspaceId)\n"
        "if (ragChunks.length > 0) contextText = formatChunksForPrompt(ragChunks)\n"
        "\n"
        "const systemInstruction = `Kamu adalah Aiden. Tugasmu membuat kuis pilihan ganda dari konteks materi.\\n` +\n"
        "  `Format JSON WAJIB: {\\\"questions\\\": [{\\n` +\n"
        "  `  \\\"id\\\": 1, \\\"question\\\": \\\"teks...\\\", \\\"options\\\": [\\\"A\\\", \\\"B\\\", \\\"C\\\", \\\"D\\\"],\\n` +\n"
        "  `  \\\"answerIndex\\\": 0, \\\"explanation\\\": \\\"alasan jawaban...\\\", \\\"pageRef\\\": \\\"Hal. 2\\\"\\n` +\n"
        "  `}]}\\n` +\n"
        "  `ATURAN KETAT: Buat TEPAT ${count} soal. Sumber HANYA dari isi konteks dokumen RAG.`\n"
        "\n"
        "const { text } = await generateText({\n"
        "  model: google(CHAT_MODEL),\n"
        "  system: systemInstruction,\n"
        "  messages: [{ role: \"user\", content: `Buat soal kuis dari konteks:\\n${contextText}` }],\n"
        "  temperature: 0.2,\n"
        "  maxTokens: 4000,\n"
        "})"
    )
    story.append(create_code_table(code_quiz, 40))

    story.append(Spacer(1, 6))

    # Screenshot Box Flashcard & Quiz
    for flow in build_screenshot_box(
        "IV.3",
        "Antarmuka Fitur Flashcard Belajar Interaktif 3D Card-Flip",
        "Menampilkan antarmuka kartu flashcard yang menyajikan pertanyaan di sisi depan dan penjelasan jawaban di sisi belakang beserta tombol penilaian tingkat kesulitan (Mudah, Sedang, Sulit)."
    ):
        story.append(flow)

    story.append(Spacer(1, 6))

    for flow in build_screenshot_box(
        "IV.4",
        "Antarmuka Fitur Kuis Pilihan Ganda dan Hasil Evaluasi Jawaban",
        "Menampilkan antarmuka pengerjaan kuis pilihan ganda dengan navigasi butir nomor soal, indikator jawaban terpilih, pembahasan AI, dan rujukan halaman materi sumber."
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # 4.3.5 Implementasi Fitur Catatan dan Riwayat Pembelajaran
    story.append(Paragraph("4.3.5 Implementasi Fitur Catatan dan Riwayat Pembelajaran", h1_style))
    story.append(Paragraph(
        "Fitur Catatan (<i>Notes</i>) dan Riwayat Aktivitas (<i>Activity History</i>) berfungsi sebagai instrumen "
        "pendukung manajemen belajar mandiri pengguna di dalam ekosistem AiDen.",
        body_style
    ))

    story.append(Paragraph("A. Manajemen Catatan Pembelajaran (Notes)", h2_style))
    story.append(Paragraph(
        "Fitur Catatan diimplementasikan melalui endpoint <code>app/api/notes/route.ts</code> dan komponen antarmuka "
        "<code>components/features/notes/notes-client.tsx</code>. Pengguna dapat membuat catatan pribadi bebas, "
        "mengedit konten catatan, mengkategorisasikan catatan, menghapus catatan dengan konfirmasi modal SweetAlert2, "
        "serta mengekspor hasil ringkasan materi secara langsung ke dalam daftar catatan.",
        body_style
    ))

    # Code Snippet 7: Notes API
    story.append(build_meta_box(
        "app/api/notes/route.ts",
        "Baris 30–74",
        "Operasi Pembuatan Catatan Baru dan Pengaitan Otomatis ke Workspace"
    ))
    code_notes = (
        "export async function POST(req: Request) {\n"
        "  const supabase = (await createClient()) as any\n"
        "  const { data: { user } } = await supabase.auth.getUser()\n"
        "  const { workspaceId, title, content, category } = await req.json()\n"
        "\n"
        "  let targetWorkspaceId = workspaceId\n"
        "  if (!targetWorkspaceId) {\n"
        "    const { data: firstWs } = await supabase.from(\"workspaces\").select(\"id\").eq(\"user_id\", user.id).limit(1).single()\n"
        "    targetWorkspaceId = firstWs?.id || null\n"
        "  }\n"
        "  const { data: newNote, error: insertError } = await supabase.from(\"notes\").insert({\n"
        "    user_id: user.id,\n"
        "    workspace_id: targetWorkspaceId,\n"
        "    title,\n"
        "    content,\n"
        "    category: category || \"Personal Note\"\n"
        "  }).select().single()\n"
        "\n"
        "  // Pencatatan otomatis ke Activity Log & Notifikasi Pengguna\n"
        "  await supabase.from(\"activity_logs\").insert({\n"
        "    user_id: user.id,\n"
        "    workspace_id: targetWorkspaceId || null,\n"
        "    action_type: \"CREATE_NOTE\",\n"
        "    details: { title, target_url: \"/notes\", note_id: newNote.id },\n"
        "  })\n"
        "}"
    )
    story.append(create_code_table(code_notes, 30))

    story.append(Spacer(1, 6))

    story.append(Paragraph("B. Pelacakan Riwayat Belajar (Activity History)", h2_style))
    story.append(Paragraph(
        "Riwayat aktivitas belajar dilacak secara otomatis melalui API <code>app/api/history/route.ts</code> "
        "dan disajikan pada antarmuka <code>components/features/history/history-card.tsx</code>. "
        "Sistem mencatat setiap aktivitas penting seperti: pembuatan workspace (<code>CREATE_WORKSPACE</code>), "
        "percakapan AI Chat (<code>ASSISTANT_CHAT</code>), generasi ringkasan (<code>GENERATE_SUMMARY</code>), "
        "pembuatan flashcard (<code>GENERATE_FLASHCARD</code>), pembuatan kuis (<code>GENERATE_QUIZ</code>), serta "
        "penyelesaian pengerjaan kuis beserta skor nilai yang diraih (<code>SUBMIT_QUIZ_ATTEMPT</code>).",
        body_style
    ))

    # Code Snippet 8: History Mapping
    story.append(build_meta_box(
        "components/features/history/history-card.tsx",
        "Baris 48–91",
        "Konfigurasi Visual dan Deskripsi Otomatis Log Riwayat Aktivitas Pembelajaran"
    ))
    code_history = (
        "const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; getDescription: (log: any) => string }> = {\n"
        "  GENERATE_FLASHCARD: {\n"
        "    label: \"Flashcard\", icon: BrainCircuit, color: \"text-emerald-500\",\n"
        "    getDescription: (log) => `Membuat ${log.details?.cardCount || ''} flashcard dari \"${log.details?.title || log.workspaces?.title}\"`\n"
        "  },\n"
        "  GENERATE_QUIZ: {\n"
        "    label: \"Quiz\", icon: Trophy, color: \"text-yellow-500\",\n"
        "    getDescription: (log) => `Membuat ${log.details?.questionCount || ''} soal quiz dari \"${log.details?.title || log.workspaces?.title}\"`\n"
        "  },\n"
        "  SUBMIT_QUIZ_ATTEMPT: {\n"
        "    label: \"Attempt Quiz\", icon: CheckCircle, color: \"text-orange-500\",\n"
        "    getDescription: (log) => `Mengerjakan quiz \"${log.details?.title}\" — skor ${log.details?.score} (${log.details?.correct} benar)`\n"
        "  },\n"
        "  GENERATE_SUMMARY: {\n"
        "    label: \"Ringkasan\", icon: FileText, color: \"text-blue-500\",\n"
        "    getDescription: (log) => `Meringkas materi \"${log.details?.title || log.workspaces?.title}\"`\n"
        "  },\n"
        "  ASSISTANT_CHAT: {\n"
        "    label: \"Chat AI\", icon: Bot, color: \"text-purple-500\",\n"
        "    getDescription: (log) => `Memulai sesi chat: \"${log.details?.title || 'Diskusi Materi'}\"`\n"
        "  }\n"
        "}"
    )
    story.append(create_code_table(code_history, 48))

    story.append(Spacer(1, 6))

    # Screenshot Box Notes & History
    for flow in build_screenshot_box(
        "IV.5",
        "Antarmuka Fitur Manajemen Catatan Pembelajaran (Notes)",
        "Menampilkan daftar catatan materi belajar pengguna yang tersusun rapi dengan filter pencarian, indikator kategori materi, tanggal pembaruan, dan tombol aksi pratinjau, edit, serta hapus catatan."
    ):
        story.append(flow)

    story.append(Spacer(1, 6))

    for flow in build_screenshot_box(
        "IV.6",
        "Antarmuka Riwayat Aktivitas Pembelajaran Pengguna (Activity History)",
        "Menampilkan linimasa rekam jejak aktivitas belajar pengguna secara kronologis, dilengkapi filter kategori (Chat, Ringkasan, Flashcard, Kuis, Catatan) dan tautan navigasi langsung ke workspace terkait."
    ):
        story.append(flow)

    story.append(Spacer(1, 10))

    # D. Dokumentasi Implementasi Database
    story.append(Paragraph("Dokumentasi Implementasi Basis Data (Database Implementation)", h1_style))
    story.append(Paragraph(
        "Sistem AiDen menggunakan basis data relasional PostgreSQL yang dikelola melalui layanan Supabase. "
        "Untuk mendukung penyimpanan representasi vektor dokumen pembelajaran, diaktifkan ekstensi <code>vector</code> (pgvector). "
        "Berikut adalah tabel dokumentasi struktur entitas basis data aktual yang digunakan oleh aplikasi:",
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
            Paragraph("id (UUID, PK)<br/>full_name (TEXT)<br/>role (TEXT)<br/>created_at (TIMESTAMP)", table_cell_style),
            Paragraph("auth.users.id (CASCADE)", table_cell_style),
            Paragraph("Menyimpan profil pengguna yang terhubung langsung dengan sistem autentikasi Supabase.", table_cell_style)
        ],
        [
            Paragraph("<b>workspaces</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>description (TEXT)<br/>created_at (TIMESTAMP)", table_cell_style),
            Paragraph("users.id (CASCADE)", table_cell_style),
            Paragraph("Ruang belajar utama pengguna yang mengelompokkan dokumen materi, riwayat chat, kuis, dan ringkasan.", table_cell_style)
        ],
        [
            Paragraph("<b>documents</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>name (TEXT)<br/>storage_path (TEXT)<br/>status (TEXT)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Metadata file PDF yang diunggah ke Storage bucket serta status proses ekstraksi ('pending', 'completed', 'failed').", table_cell_style)
        ],
        [
            Paragraph("<b>document_chunks</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>document_id (UUID, FK)<br/>workspace_id (UUID, FK)<br/>content (TEXT)<br/>embedding (VECTOR 3072)<br/>metadata (JSONB)", table_cell_style),
            Paragraph("documents.id<br/>workspaces.id", table_cell_style),
            Paragraph("<b>Tabel Inti RAG:</b> Menyimpan fragmen teks dokumen dan vektor dense 3072 dimensi hasil embedding untuk pencarian semantik.", table_cell_style)
        ],
        [
            Paragraph("<b>summaries</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (JSONB)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan hasil ringkasan dokumen materi komprehensif yang dihasilkan oleh model AI berbasis RAG.", table_cell_style)
        ],
        [
            Paragraph("<b>flashcards</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (JSONB)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan kumpulan kartu tanya-jawab flashcard beserta tingkat reaksi pemahaman pengguna.", table_cell_style)
        ],
        [
            Paragraph("<b>quizzes</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (JSONB)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan butir soal kuis pilihan ganda, kunci jawaban, pembahasan, serta riwayat percobaan (attempts).", table_cell_style)
        ],
        [
            Paragraph("<b>notes</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>workspace_id (UUID, FK)<br/>user_id (UUID, FK)<br/>title (TEXT)<br/>content (TEXT)<br/>category (TEXT)", table_cell_style),
            Paragraph("workspaces.id<br/>users.id", table_cell_style),
            Paragraph("Menyimpan catatan belajar personal pengguna baik yang dibuat manual maupun diekspor dari hasil ringkasan.", table_cell_style)
        ],
        [
            Paragraph("<b>activity_logs</b>", table_cell_style),
            Paragraph("id (UUID, PK)<br/>user_id (UUID, FK)<br/>workspace_id (UUID, FK)<br/>action_type (TEXT)<br/>details (JSONB)<br/>created_at (TIMESTAMP)", table_cell_style),
            Paragraph("users.id<br/>workspaces.id", table_cell_style),
            Paragraph("Menyimpan log audit aktivitas belajar pengguna secara terperinci untuk disajikan pada halaman riwayat belajar.", table_cell_style)
        ]
    ]

    db_table = Table(db_tables_data, colWidths=[80, 115, 95, 150])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
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

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_pdf_path}")

if __name__ == "__main__":
    out_dir = r"c:\Users\adent\Desktop\NEXT-JS\aidenv2\docs"
    os.makedirs(out_dir, exist_ok=True)
    out_pdf = os.path.join(out_dir, "development.pdf")
    generate_development_pdf(out_pdf)
