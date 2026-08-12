import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = Path(os.environ.get("RESUME_OUTPUT", Path(__file__).with_name("Jory-Pestorious-Resume.pdf")))
GEORGIE = Path(__file__).with_name("georgie-lounging.png")

INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#536174")
ACCENT = colors.HexColor("#176B87")
AMBER = colors.HexColor("#B96C00")
RULE = colors.HexColor("#C8D5DF")

SECTION_NUMBERS = {
    "Technical range": "01",
    "Experience": "02",
    "Selected developer tools": "03",
    "Education": "04",
}


def link(url: str, label: str) -> str:
    return f'<link href="{url}" color="{ACCENT.hexval()}">{label}</link>'


def contact_details() -> str:
    details = (
        "Victoria, MN | Remote or relocation | "
        + link("mailto:jory@pestorious.com", "jory@pestorious.com")
        + " | 952-270-7529 | "
        + link("https://jorypestorious.com/", "jorypestorious.com")
        + " | "
    )
    return (
        details
        + link("https://www.linkedin.com/in/jory-fullstack-engineer/", "LinkedIn")
        + " | "
        + link("https://github.com/joryeugene", "GitHub")
    )


styles = getSampleStyleSheet()

name_style = ParagraphStyle(
    "Name",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=20,
    leading=22,
    textColor=INK,
    spaceAfter=1,
)

title_style = ParagraphStyle(
    "Title",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=12,
    textColor=ACCENT,
    spaceAfter=3,
)

contact_style = ParagraphStyle(
    "Contact",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=10.5,
    textColor=MUTED,
    spaceAfter=4,
)

section_style = ParagraphStyle(
    "Section",
    parent=styles["Normal"],
    fontName="Courier-Bold",
    fontSize=8.7,
    leading=11,
    textColor=ACCENT,
    spaceBefore=0,
    spaceAfter=0,
)

body_style = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=11.7,
    textColor=INK,
    alignment=TA_LEFT,
    spaceAfter=3,
)

compact_style = ParagraphStyle(
    "Compact",
    parent=body_style,
    fontSize=9.2,
    leading=11,
    spaceAfter=2,
)

grid_style = ParagraphStyle(
    "Grid",
    parent=compact_style,
    fontSize=9.3,
    leading=11,
    spaceAfter=0,
)

bullet_style = ParagraphStyle(
    "Bullet",
    parent=body_style,
    leftIndent=10,
    firstLineIndent=-7,
    bulletIndent=0,
    spaceAfter=1.5,
)

role_style = ParagraphStyle(
    "Role",
    parent=body_style,
    fontName="Helvetica-Bold",
    leading=10.8,
    spaceAfter=0,
)

date_style = ParagraphStyle(
    "Date",
    parent=body_style,
    fontName="Helvetica",
    fontSize=9,
    leading=11.2,
    textColor=MUTED,
    alignment=TA_LEFT,
    spaceAfter=0,
)


def section(title: str):
    label = f"{SECTION_NUMBERS[title]} // {title.upper()}"
    heading = Table(
        [[Paragraph(label, section_style), ""]],
        colWidths=[2.35 * inch, 5.15 * inch],
        style=TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (1, 0), (1, 0), 0.6, RULE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        ),
    )
    return heading


def role(company: str, title: str, dates: str, location: str):
    left = Paragraph(f"{company} | {title}", role_style)
    right = Paragraph(f"{dates} | {location}", date_style)
    return Table(
        [[left, right]],
        colWidths=[4.65 * inch, 2.85 * inch],
        style=TableStyle(
            [
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        ),
    )


def bullet(text: str):
    return Paragraph(f"- {text}", bullet_style)


def range_table():
    rows = [
        [
            Paragraph("<b>AI APIs and agents</b><br/>OpenAI and Anthropic APIs, Azure AI, MCP servers, RAG, agent workflows", grid_style),
            Paragraph("<b>Product interfaces</b><br/>TypeScript, React, Tailwind, Vite, TanStack Query, ECharts, D3, Storybook", grid_style),
        ],
        [
            Paragraph("<b>Backend and data</b><br/>Python, FastAPI, PostgreSQL, SQL Server, SQLAlchemy, Node.js, Clojure, C#/.NET", grid_style),
            Paragraph("<b>Infrastructure and delivery</b><br/>AWS, Terraform, Docker, Kubernetes, GitHub Actions, agent worktrees, WorkOS", grid_style),
        ],
        [
            Paragraph("<b>Real-time 3D</b><br/>Unity, C#, Photon Networking, Azure PlayFab", grid_style),
            Paragraph("<b>Verification</b><br/>Jest, Cypress, Playwright, agent evaluation, code review, observability", grid_style),
        ],
    ]
    return Table(
        rows,
        colWidths=[3.75 * inch, 3.75 * inch],
        style=TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, 1), 0.35, colors.HexColor("#E2E9EE")),
                ("LINEAFTER", (0, 0), (0, -1), 0.35, colors.HexColor("#E2E9EE")),
            ]
        ),
    )


def tools_table():
    dadbod = Paragraph(
        link("https://github.com/joryeugene/dadbod-grip.nvim", "<b>dadbod-grip.nvim</b>")
        + "<br/>Vim-native database editing with staged changes, SQL preview, transaction undo, and cross-database workflows.",
        grid_style,
    )
    second_tool = Paragraph(
        link("https://jorypestorious.com/vim/", "<b>Phalene-Vim</b>")
        + "<br/>Browser-based Vim with normal-mode editing, a guided tutor, file browser, command palette, and mobile controls.",
        grid_style,
    )
    return Table(
        [[dadbod, second_tool]],
        colWidths=[3.75 * inch, 3.75 * inch],
        style=TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, -1), 0.5, RULE),
                ("LINEAFTER", (0, 0), (0, 0), 0.4, RULE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        ),
    )


def metadata(canvas, _doc):
    canvas.setTitle("Jory Pestorious - Full-Stack AI Product Engineer Resume")
    canvas.setAuthor("Jory Pestorious")
    canvas.setSubject("Full-stack AI product engineering, agent systems, developer tools, and product infrastructure")
    canvas.setFillColor(ACCENT)
    canvas.rect(0, LETTER[1] - 4, LETTER[0], 4, stroke=0, fill=1)
    canvas.rect(0, 0, LETTER[0], 3, stroke=0, fill=1)
    canvas.setFillColor(AMBER)
    canvas.rect(0.34 * inch, LETTER[1] - 0.83 * inch, 2.2, 0.42 * inch, stroke=0, fill=1)
    canvas.rect(LETTER[0] - 1.08 * inch, 0, 0.6 * inch, 3, stroke=0, fill=1)

    if GEORGIE.is_file():
        width = 0.95 * inch
        height = width * 321 / 480
        x = LETTER[0] - 0.45 * inch - width
        y = 3
        canvas.drawImage(ImageReader(str(GEORGIE)), x, y, width, height, mask="auto")
        canvas.linkURL("https://jorypestorious.com/", (x, y, x + width, y + height), relative=0)


def build():
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=LETTER,
        rightMargin=0.48 * inch,
        leftMargin=0.48 * inch,
        topMargin=0.33 * inch,
        bottomMargin=0.22 * inch,
        title="Jory Pestorious - Full-Stack AI Product Engineer Resume",
        author="Jory Pestorious",
        subject="Full-stack AI product engineering, agent systems, developer tools, and product infrastructure",
    )

    story = [
        Paragraph("JORY PESTORIOUS", name_style),
        Paragraph("Full-Stack AI Product Engineer", title_style),
        Paragraph(contact_details(), contact_style),
        Paragraph(
            "Full-stack AI product engineer who becomes productive quickly in unfamiliar stacks and owns the path from interface through production. "
            "Joined Workhelix as the sole frontend engineer, then expanded into Python/FastAPI backend performance, AWS/Terraform, GitHub Actions, agent workflows, security controls, and production data. "
            "Previously co-founded the team behind a networked 3D game with 50M+ downloads. "
            "An M.A. in ESL shapes the product standard: if users need a manual, the interface failed.",
            body_style,
        ),
        section("Technical range"),
        range_table(),
        section("Experience"),
        role("Workhelix", "Founding Full-Stack Engineer", "07/2024 - 07/2026", "Remote / San Francisco"),
        bullet(
            "Joined pre-seed as the sole frontend engineer, translated Figma designs into reusable React/TypeScript components, and replaced the Bubble.io prototype with the production application used through Series A."
        ),
        bullet(
            "Expanded into substantial ownership of the Python/FastAPI backend, including SQLAlchemy/PostgreSQL performance work, production data migrations, and AWS infrastructure managed with Terraform."
        ),
        bullet(
            "Built GitHub Actions and agent workflows for code review and releases; implemented engineering controls supporting SOC 2 Type II."
        ),
        bullet(
            "Built the product experience that presented the data science team's assessment outputs through filters, comparisons, and drilldowns; delivered OAuth, WorkOS SSO, JWT, multi-tenant isolation, and admin tools."
        ),
        Spacer(1, 1),
        role("U.S. Bank", "Automation Engineer, AVP", "07/2023 - 07/2024", "Remote"),
        bullet(
            "Worked as an internal forward-deployed engineer in the centralized automation team, replacing repetitive workflows with RPA, custom Python, and purpose-built web applications."
        ),
        bullet(
            "Automated bank-wide ATM code changes, AS/400 terminal-emulation workflows, and SQL Server data work; built C#/.NET developer-tool prototypes with LLM and Azure AI services."
        ),
        Spacer(1, 1),
        role("We're Five Games", "Co-Founder and Technical Lead", "08/2018 - 06/2023", "Minneapolis, MN"),
        bullet(
            "Co-founded the studio and architected Totally Reliable Delivery Service, a networked Unity/C# 3D physics game with 50M+ downloads across console, PC, and mobile."
        ),
        bullet(
            "Designed Photon Networking and Azure PlayFab systems so four online ragdolls could grip into live chains and hang from moving vehicles and rockets; led 5+ engineers and cut release cycles from eight weeks to four."
        ),
        bullet("Led technical strategy through the tinyBuild acquisition and the later Atari publishing acquisition."),
        Spacer(1, 1),
        role("Gravie", "Software Engineer", "10/2017 - 08/2018", "Minneapolis, MN"),
        bullet(
            "Built Clojure/Groovy services and React/Angular interfaces, translated the design team's Sketch style guide into reusable frontend standards, and orchestrated zero-downtime MySQL migrations."
        ),
        Spacer(1, 1),
        role("Best Buy", "Software Engineer", "12/2016 - 10/2017", "Richfield, MN"),
        bullet(
            "Built a Scala application that saved 30+ hours per sprint and improved Java/Spring/Solr/Akka/Riak product-discovery services."
        ),
        Spacer(1, 2),
        role("The Software Guild", "Java Developer Apprenticeship", "07/2016 - 12/2016", "Minneapolis, MN"),
        bullet(
            "Built full-stack Java/Spring/MySQL applications with JSP/jQuery while practicing test-driven development, pair programming, REST API design, and code review."
        ),
        Spacer(1, 3),
        section("Selected developer tools"),
        tools_table(),
        section("Education"),
        Paragraph(
            "<b>Hamline University</b>, M.A. English as a Second Language, 2015 &nbsp;&nbsp; | &nbsp;&nbsp; "
            "<b>University of Minnesota</b>, B.S. Biology, 2011<br/>"
            "<b>Udacity</b>, Front-End Web Developer Nanodegree, 2016",
            compact_style,
        ),
    ]

    doc.build(story, onFirstPage=metadata, onLaterPages=metadata)
    print(OUTPUT)


if __name__ == "__main__":
    build()
