"""Generate small sample PDFs and a PNG for CampusConnect Phase 2 seed materials."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path


def escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def make_pdf(path: Path, title: str, lines: list[str]) -> None:
    parts = [f"BT /F1 16 Tf 50 750 Td ({escape_pdf_text(title)}) Tj", "/F1 11 Tf"]
    for line in lines:
        parts.append(f"0 -18 Td ({escape_pdf_text(line)}) Tj")
    parts.append("ET")
    stream = "\n".join(parts).encode("latin-1", errors="replace")

    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
        ),
        b"4 0 obj<< /Length %d >>stream\n" % len(stream) + stream + b"\nendstream\nendobj\n",
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(out))
        out.extend(obj)

    xref_pos = len(out)
    out.extend(f"xref\n0 {len(offsets)}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(
        f"trailer<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()
    )
    path.write_bytes(bytes(out))
    print(f"{path.name}: {path.stat().st_size} bytes")


def make_png(path: Path, width: int = 240, height: int = 120) -> None:
    rows: list[bytes] = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            if y < 32:
                row.extend((26, 115, 232))  # #1A73E8 banner
            elif 48 <= y <= 72 and 24 <= x <= width - 24:
                row.extend((255, 255, 255))
            else:
                row.extend((248, 249, 250))
        rows.append(bytes(row))

    compressed = zlib.compress(b"".join(rows), 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)))
    png.extend(chunk(b"IDAT", compressed))
    png.extend(chunk(b"IEND", b""))
    path.write_bytes(bytes(png))
    print(f"{path.name}: {path.stat().st_size} bytes")


def main() -> None:
    out = Path(__file__).resolve().parents[1] / "backend" / "src" / "main" / "resources" / "seed-files"
    out.mkdir(parents=True, exist_ok=True)

    make_pdf(
        out / "jdbc-quick-reference.pdf",
        "JDBC Quick Reference - MCA Sem II",
        [
            "CampusConnect sample material",
            "1. Obtain a Connection (DataSource or DriverManager)",
            "2. Prefer PreparedStatement over Statement",
            "3. Execute query or update",
            "4. Navigate ResultSet rows and columns",
            "5. Close resources with try-with-resources",
        ],
    )
    make_pdf(
        out / "servlet-lifecycle.pdf",
        "Servlet Lifecycle Notes",
        [
            "init() - called once when the servlet is loaded",
            "service() - handles each request via doGet/doPost",
            "destroy() - cleanup before the servlet is unloaded",
            "Request -> Container -> Servlet -> Response",
            "Use RequestDispatcher for forward and include",
        ],
    )
    make_pdf(
        out / "bank-schema-notes.pdf",
        "Sample Bank Schema for JDBC Lab",
        [
            "TABLE accounts (id, holder_name, balance)",
            "TABLE transactions (id, account_id, amount, type, created_at)",
            "FK: transactions.account_id references accounts.id",
            "Lab task: implement insert, update, delete, and select",
        ],
    )
    make_png(out / "jdbc-architecture.png")


if __name__ == "__main__":
    main()
