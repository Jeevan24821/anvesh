import random
from datetime import date, datetime, timedelta
from typing import List, Dict, Any

# Fictional Institution definitions (40 institutions)
INSTITUTIONS_DATA = [
    {
        "aicte_id": "1-3349102801",
        "name": "Aryavart Institute of Engineering and Technology",
        "type": "Engineering & Technology",
        "region": "Northern",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "address": "Sector 14, Ring Road Knowledge Park",
        "pincode": "226021",
        "email": "director@aryavart-tech.ac.in",
        "phone": "+91-522-2984101",
        "principal": "Dr. Virendra Nath Shukla",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102802",
        "name": "Sahyadri College of Advanced Engineering",
        "type": "Engineering & Technology",
        "region": "Western",
        "state": "Maharashtra",
        "district": "Pune",
        "address": "Talegaon MIDC Educational Corridor",
        "pincode": "410507",
        "email": "principal@sahyadri-engg.org",
        "phone": "+91-20-27845100",
        "principal": "Dr. Archana Deshmukh",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102803",
        "name": "Cauvery National Institute of Technology",
        "type": "Engineering & Technology",
        "region": "South-West",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "address": "Electronics City Phase 2",
        "pincode": "560100",
        "email": "dean@cauvery-nit.edu.in",
        "phone": "+91-80-41239800",
        "principal": "Dr. K. S. Venkatesh Murthy",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102804",
        "name": "Chola Institute of Management & Research",
        "type": "Management",
        "region": "Southern",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "address": "Old Mahabalipuram Road, IT Expressway",
        "pincode": "600096",
        "email": "admissions@chola-management.org",
        "phone": "+91-44-24501234",
        "principal": "Dr. Meenakshi Sundaram",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102805",
        "name": "Kakatiya Academy of Technical Sciences",
        "type": "Engineering & Technology",
        "region": "South-Central",
        "state": "Telangana",
        "district": "Hyderabad",
        "address": "Gachibowli Financial District Extn",
        "pincode": "500032",
        "email": "registrar@kakatiya-academy.edu.in",
        "phone": "+91-40-66778899",
        "principal": "Dr. P. Ravinder Rao",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102806",
        "name": "Kalinga Institute of Polytechnic & Technology",
        "type": "Polytechnic",
        "region": "Eastern",
        "state": "Odisha",
        "district": "Bhubaneswar",
        "address": "Chandaka Industrial Estate",
        "pincode": "751024",
        "email": "contact@kalinga-polytechnic.ac.in",
        "phone": "+91-674-2725900",
        "principal": "Er. Soumya Ranjan Mohanty",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102807",
        "name": "Malwa Institute of Pharmaceutical Sciences",
        "type": "Pharmacy",
        "region": "Central",
        "state": "Madhya Pradesh",
        "district": "Indore",
        "address": "Bypass Road, Manglia",
        "pincode": "453771",
        "email": "director@malwa-pharmacy.edu.in",
        "phone": "+91-731-4098200",
        "principal": "Dr. Pradeep Kumar Patidar",
        "status": "Under Notice"
    },
    {
        "aicte_id": "1-3349102808",
        "name": "Girnar Engineering College & Research",
        "type": "Engineering & Technology",
        "region": "Western",
        "state": "Gujarat",
        "district": "Ahmedabad",
        "address": "Sarkhej-Gandhinagar Highway",
        "pincode": "382481",
        "email": "admin@girnar-engg.org",
        "phone": "+91-79-26925500",
        "principal": "Dr. Bhavesh Patel",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102809",
        "name": "Thar Institute of Technology & Management",
        "type": "Engineering & Technology",
        "region": "North-West",
        "state": "Rajasthan",
        "district": "Jaipur",
        "address": "Sitapura Industrial Area",
        "pincode": "302022",
        "email": "office@thar-institute.edu.in",
        "phone": "+91-141-2770150",
        "principal": "Dr. Vikram Singh Shekhawat",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102810",
        "name": "Periyar Valley School of Architecture",
        "type": "Architecture",
        "region": "South-West",
        "state": "Kerala",
        "district": "Ernakulam",
        "address": "Aluva Bypass Junction",
        "pincode": "683101",
        "email": "dean@periyar-architecture.ac.in",
        "phone": "+91-484-2621000",
        "principal": "Ar. Ananya Kurian",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102811",
        "name": "Indraprastha Institute of Technology & Management",
        "type": "Engineering & Technology",
        "region": "Northern",
        "state": "Delhi NCR",
        "district": "South West Delhi",
        "address": "Institutional Area, Dwarka Sector 16",
        "pincode": "110078",
        "email": "registrar@iitm-dwarka.ac.in",
        "phone": "+91-11-28034000",
        "principal": "Dr. Alok Nath Tripathi",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102812",
        "name": "Hooghly River College of Engineering",
        "type": "Engineering & Technology",
        "region": "Eastern",
        "state": "West Bengal",
        "district": "Kolkata",
        "address": "Salt Lake Sector V, Bidhannagar",
        "pincode": "700091",
        "email": "director@hooghly-engg.edu.in",
        "phone": "+91-33-23579000",
        "principal": "Dr. Subhasish Banerjee",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102813",
        "name": "Satpura Polytechnic Institute",
        "type": "Polytechnic",
        "region": "Central",
        "state": "Madhya Pradesh",
        "district": "Bhopal",
        "address": "Raisen Road, Patel Nagar",
        "pincode": "462021",
        "email": "principal@satpura-poly.org",
        "phone": "+91-755-2751100",
        "principal": "Er. Mahendra Pal Yadav",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102814",
        "name": "Doaba Institute of Engineering and Technology",
        "type": "Engineering & Technology",
        "region": "North-West",
        "state": "Punjab",
        "district": "Jalandhar",
        "address": "GT Road, Phagwara Highway",
        "pincode": "144001",
        "email": "contact@doaba-tech.ac.in",
        "phone": "+91-181-2234000",
        "principal": "Dr. Gurpreet Singh Dhillon",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102815",
        "name": "Magadh Academy of Technical Education",
        "type": "Engineering & Technology",
        "region": "Northern",
        "state": "Bihar",
        "district": "Patna",
        "address": "Bailey Road, Danapur Cantt",
        "pincode": "801503",
        "email": "info@magadh-academy.edu.in",
        "phone": "+91-612-2590200",
        "principal": "Dr. Awadhesh Kumar Sinha",
        "status": "Under Notice"
    },
    {
        "aicte_id": "1-3349102816",
        "name": "Konkan Coast College of Pharmacy",
        "type": "Pharmacy",
        "region": "Western",
        "state": "Maharashtra",
        "district": "Navi Mumbai",
        "address": "Sector 15, Kopar Khairane",
        "pincode": "400709",
        "email": "principal@konkan-pharmacy.ac.in",
        "phone": "+91-22-27548900",
        "principal": "Dr. Snehal Kulkarni",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102817",
        "name": "Deccan School of Management and Leadership",
        "type": "Management",
        "region": "South-Central",
        "state": "Telangana",
        "district": "Secunderabad",
        "address": "Trimulgherry Military Area",
        "pincode": "500015",
        "email": "dean@deccan-leadership.org",
        "phone": "+91-40-27791200",
        "principal": "Dr. Syeda Fatima Begum",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102818",
        "name": "Vaigai Institute of Technology & Sciences",
        "type": "Engineering & Technology",
        "region": "Southern",
        "state": "Tamil Nadu",
        "district": "Madurai",
        "address": "Kappalur Industrial Estate",
        "pincode": "625008",
        "email": "director@vaigai-tech.edu.in",
        "phone": "+91-452-2484000",
        "principal": "Dr. T. Ramanathan",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102819",
        "name": "Shivalik Hills Institute of Technology",
        "type": "Engineering & Technology",
        "region": "North-West",
        "state": "Himachal Pradesh",
        "district": "Solan",
        "address": "Kumarhatti Valley Campus",
        "pincode": "173229",
        "email": "office@shivalik-hills.ac.in",
        "phone": "+91-1792-268000",
        "principal": "Dr. Rakesh Chand Thakur",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102820",
        "name": "Godavari Institute of Engineering & Technology",
        "type": "Engineering & Technology",
        "region": "South-Central",
        "state": "Andhra Pradesh",
        "district": "Rajahmundry",
        "address": "NH-16, Chaitanya Knowledge City",
        "pincode": "533296",
        "email": "principal@godavari-iet.edu.in",
        "phone": "+91-883-2484444",
        "principal": "Dr. M. S. R. Murthy",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102821",
        "name": "Brahmaputra Valley College of Engineering",
        "type": "Engineering & Technology",
        "region": "Eastern",
        "state": "Assam",
        "district": "Guwahati",
        "address": "Amingaon Industrial Park",
        "pincode": "781031",
        "email": "director@brahmaputra-engg.org",
        "phone": "+91-361-2680100",
        "principal": "Dr. Hiren Kumar Sarma",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102822",
        "name": "Marathwada Institute of Technology",
        "type": "Engineering & Technology",
        "region": "Western",
        "state": "Maharashtra",
        "district": "Chhatrapati Sambhajinagar",
        "address": "Beed Bypass Road",
        "pincode": "431010",
        "email": "principal@marathwada-mit.ac.in",
        "phone": "+91-240-2375111",
        "principal": "Dr. Nilesh Gaikwad",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102823",
        "name": "Narmada Valley Institute of Technical Studies",
        "type": "Polytechnic",
        "region": "Central",
        "state": "Gujarat",
        "district": "Vadodara",
        "address": "Manjusar GIDC Estate",
        "pincode": "391775",
        "email": "info@narmada-valley.edu.in",
        "phone": "+91-265-2884000",
        "principal": "Er. Hardik Somabhai Shah",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102824",
        "name": "Panchala School of Architecture and Planning",
        "type": "Architecture",
        "region": "Northern",
        "state": "Haryana",
        "district": "Gurugram",
        "address": "Sohna Road Educational Corridor",
        "pincode": "122103",
        "email": "dean@panchala-arch.ac.in",
        "phone": "+91-124-4890000",
        "principal": "Ar. Devendra Swaroop",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102825",
        "name": "Kaveri Delta Institute of Management",
        "type": "Management",
        "region": "Southern",
        "state": "Tamil Nadu",
        "district": "Tiruchirappalli",
        "address": "Thanjavur Main Road",
        "pincode": "620015",
        "email": "director@kaveri-delta.org",
        "phone": "+91-431-2501000",
        "principal": "Dr. V. Krishnakumar",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102826",
        "name": "Sone Valley Institute of Engineering & Technology",
        "type": "Engineering & Technology",
        "region": "Northern",
        "state": "Uttar Pradesh",
        "district": "Varanasi",
        "address": "Babatpur Airport Highway",
        "pincode": "221006",
        "email": "principal@sone-valley.ac.in",
        "phone": "+91-542-2624500",
        "principal": "Dr. Ram Surat Pandey",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102827",
        "name": "Malabar Coast College of Engineering",
        "type": "Engineering & Technology",
        "region": "South-West",
        "state": "Kerala",
        "district": "Kozhikode",
        "address": "Kunnamangalam Campus",
        "pincode": "673571",
        "email": "info@malabar-engg.edu.in",
        "phone": "+91-495-2800100",
        "principal": "Dr. Thomas Mathew",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102828",
        "name": "Bundelkhand Technical Institute",
        "type": "Engineering & Technology",
        "region": "Northern",
        "state": "Uttar Pradesh",
        "district": "Jhansi",
        "address": "Kanpur Road Educational Zone",
        "pincode": "284128",
        "email": "registrar@bundelkhand-tech.ac.in",
        "phone": "+91-510-2320500",
        "principal": "Dr. Brajesh Kumar Tiwari",
        "status": "Under Notice"
    },
    {
        "aicte_id": "1-3349102829",
        "name": "Vindhya Academy of Pharmaceutical Sciences",
        "type": "Pharmacy",
        "region": "Central",
        "state": "Madhya Pradesh",
        "district": "Jabalpur",
        "address": "Nagpur Road, Tilwara Ghat",
        "pincode": "482003",
        "email": "dean@vindhya-pharma.org",
        "phone": "+91-761-2678000",
        "principal": "Dr. Sanjay Shrivastava",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102830",
        "name": "Mahanadi Institute of Technology & Management",
        "type": "Engineering & Technology",
        "region": "Central",
        "state": "Chhattisgarh",
        "district": "Raipur",
        "address": "Naya Raipur Knowledge City Sector 24",
        "pincode": "492018",
        "email": "principal@mahanadi-tech.ac.in",
        "phone": "+91-771-2970000",
        "principal": "Dr. Hemant Kumar Chandrakar",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102831",
        "name": "Aravalli Institute of Technical Studies",
        "type": "Engineering & Technology",
        "region": "North-West",
        "state": "Rajasthan",
        "district": "Udaipur",
        "address": "Umarada Industrial Area",
        "pincode": "313015",
        "email": "director@aravalli-tech.org",
        "phone": "+91-294-2655000",
        "principal": "Dr. Ajay Kumar Sharma",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102832",
        "name": "Coromandel College of Engineering & Technology",
        "type": "Engineering & Technology",
        "region": "South-Central",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "address": "Gambhiram IT SEZ Road",
        "pincode": "530052",
        "email": "info@coromandel-engg.edu.in",
        "phone": "+91-891-2856000",
        "principal": "Dr. K. V. Satyanarayana",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102833",
        "name": "Chotanagpur Polytechnic College",
        "type": "Polytechnic",
        "region": "Eastern",
        "state": "Jharkhand",
        "district": "Ranchi",
        "address": "Tupudana Industrial Area",
        "pincode": "834003",
        "email": "principal@chotanagpur-poly.org",
        "phone": "+91-651-2250100",
        "principal": "Er. Anand Prakash Tirkey",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102834",
        "name": "Nilgiri School of Business Management",
        "type": "Management",
        "region": "Southern",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "address": "Avinashi Road, Peelamedu",
        "pincode": "641004",
        "email": "dean@nilgiri-business.edu.in",
        "phone": "+91-422-2574000",
        "principal": "Dr. Saraswathi Natarajan",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102835",
        "name": "Tapti Valley Institute of Engineering",
        "type": "Engineering & Technology",
        "region": "Western",
        "state": "Gujarat",
        "district": "Surat",
        "address": "Olpad-Sayan Road",
        "pincode": "394540",
        "email": "office@tapti-valley.ac.in",
        "phone": "+91-2621-244000",
        "principal": "Dr. Chirag J. Patel",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102836",
        "name": "Yamuna Institute of Technology & Research",
        "type": "Engineering & Technology",
        "region": "Northern",
        "state": "Uttar Pradesh",
        "district": "Noida",
        "address": "Sector 62, Electronic City",
        "pincode": "201309",
        "email": "contact@yamuna-tech.ac.in",
        "phone": "+91-120-4567890",
        "principal": "Dr. Sanjay Kumar Tyagi",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102837",
        "name": "Khandesh College of Engineering & Technology",
        "type": "Engineering & Technology",
        "region": "Western",
        "state": "Maharashtra",
        "district": "Jalgaon",
        "address": "Bambhori Educational Hub",
        "pincode": "425001",
        "email": "principal@khandesh-engg.org",
        "phone": "+91-257-2258000",
        "principal": "Dr. Kishor S. Chaudhari",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102838",
        "name": "Gomti Valley Academy of Management",
        "type": "Management",
        "region": "Northern",
        "state": "Uttar Pradesh",
        "district": "Ayodhya",
        "address": "Faizabad Bypass Campus",
        "pincode": "224001",
        "email": "director@gomti-valley.edu.in",
        "phone": "+91-5278-245000",
        "principal": "Dr. Om Prakash Srivastava",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102839",
        "name": "Konkan Engineering and Applied Sciences",
        "type": "Engineering & Technology",
        "region": "Western",
        "state": "Goa",
        "district": "South Goa",
        "address": "Verna Electronic City",
        "pincode": "403722",
        "email": "dean@konkan-goa.ac.in",
        "phone": "+91-832-2783000",
        "principal": "Dr. Mario Jude Fernandes",
        "status": "Approved"
    },
    {
        "aicte_id": "1-3349102840",
        "name": "Garhwal Himalayan Institute of Technology",
        "type": "Engineering & Technology",
        "region": "Northern",
        "state": "Uttarakhand",
        "district": "Dehradun",
        "address": "Chakrata Road, Selaqui Industrial Area",
        "pincode": "248011",
        "email": "registrar@garhwal-himalayan.ac.in",
        "phone": "+91-135-2698000",
        "principal": "Dr. Deepak Singh Rawat",
        "status": "Approved"
    }
]

# Realistically crafted Complaint templates with specific categories and narrative patterns
COMPLAINT_TEMPLATES = [
    {
        "category": "Fee Overcharging / Capitation",
        "bureau": "PGRC (Public Grievance Redressal)",
        "priority": "Urgent",
        "subject": "Extortionate demand of unapproved development fee and capitation fee",
        "description": "College administration is mandatorily demanding Rs. 75,000 extra in cash under the pretext of 'Campus Development & Skill Training Fee' in violation of the AICTE Fee Regulatory Committee guidelines. Refusal to pay has led to threats of barring from end-semester practical examinations."
    },
    {
        "category": "Fee Overcharging / Capitation",
        "bureau": "Regulation Bureau (RB)",
        "priority": "High",
        "subject": "Flagrant violation of AICTE Approval Process Handbook norms regarding annual tuition fees",
        "description": "Formal complaint submitted against the governing trust regarding unauthorized enhancement of tuition fee by 45% without approval from the State Fee Regulatory Committee. The institution has collected undocumented caution deposits exceeding prescribed ceilings."
    },
    {
        "category": "Withholding Original Certificates",
        "bureau": "PGRC (Public Grievance Redressal)",
        "priority": "Urgent",
        "subject": "Refusal to return original 10th/12th marksheets and migration certificate upon withdrawal",
        "description": "I submitted a formal withdrawal request within the permitted AICTE cutoff period. The college registrar refuses to return original academic credentials and demands total payment of subsequent year fees before releasing certificates."
    },
    {
        "category": "Faculty Non-Payment & Understaffing",
        "bureau": "Regulation Bureau (RB)",
        "priority": "High",
        "subject": "Non-disbursement of 7th Pay Commission salaries and fictitious faculty rosters",
        "description": "Assistant and Associate Professors have not received monthly salaries for the past 5 consecutive months. Inspection documents submitted to AICTE showed 48 faculty members, but in reality only 18 adjunct teachers are handling all semesters."
    },
    {
        "category": "Infrastructure & Laboratory Deficit",
        "bureau": "Approval Bureau (AB)",
        "priority": "Medium",
        "subject": "Non-existent specialized laboratories and counterfeit compliance reports",
        "description": "The institution reported full compliance for AI/ML and Robotics lab equipment during extension of approval. On ground, the designated lab spaces are empty storage rooms without software licenses, high-end workstations, or safety gear."
    },
    {
        "category": "Unapproved Courses & Excess Intake",
        "bureau": "Approval Bureau (AB)",
        "priority": "Urgent",
        "subject": "Admission of 120 unapproved students exceeding sanctioned intake capacity",
        "description": "Institution admitted 180 students in B.Tech Computer Science against a sanctioned capacity of 60 seats. Management issued provisional roll numbers without university affiliation endorsement, jeopardizing students' legal academic status."
    },
    {
        "category": "Ragging & Student Harassment",
        "bureau": "Anti-Ragging Cell (ARC)",
        "priority": "Urgent",
        "subject": "Physical harassment in boys hostel and non-operational Anti-Ragging Squad",
        "description": "First-year students were repeatedly coerced into hostel harassment and mental torture by senior students. College Anti-Ragging Committee failed to file an FIR or convene an inquiry despite written representation to the Chief Warden."
    },
    {
        "category": "Misappropriation of Grant Funds",
        "bureau": "Skill Development Cell (SDC)",
        "priority": "High",
        "subject": "Embezzlement of AICTE PMKVY-TI skill development training funds",
        "description": "Institutional beneficiaries list under PMKVY skill development scheme includes fabricated Aadhaar numbers. Training kits, stipends, and industrial certifications were never distributed to enrolled rural candidates."
    },
    {
        "category": "Admissions & Affiliation Irregularities",
        "bureau": "Policy & Academic Planning Bureau (PAPB)",
        "priority": "Medium",
        "subject": "Drastic deviation from AICTE Model Curriculum and mandatory internship guidelines",
        "description": "College failed to implement AICTE mandatory 400-hour industrial internship program and has not updated engineering syllabus to reflect 2024 AICTE curriculum frameworks, affecting employability and accreditation metrics."
    },
    {
        "category": "Governance Malpractice & Retaliation",
        "bureau": "PGRC (Public Grievance Redressal)",
        "priority": "High",
        "subject": "Retaliation and suspension of student representative for reporting laboratory deficit",
        "description": "Student council secretary was illegally debarred from campus and served a police notice after lodging a formal grievance about lack of fire safety systems and dysfunctional mechanical workshops."
    }
]

OFFICERS_LIST = [
    "Dr. Sunita Sharma (Chief Redressal Officer)",
    "Er. Rajesh Verma (Joint Director, Regulation)",
    "Shri Arun Kumar Saxena (Deputy Director, Approval)",
    "Dr. Priyadarshini Rao (Assistant Director, PAPB)",
    "Col. Vikramaditya Rathore (Chief Coordinator, Anti-Ragging)",
    "Smt. Deepa Nair (Skill Mission Officer, SDC)",
    "Dr. Manoj K. Srivastava (Senior Vigilance Officer)",
    "Er. Amitava Sen (Zonal Scrutiny Officer)"
]

COMPLAINANT_NAMES = [
    "Aditya Narayan", "Sneha Mukherjee", "Rahul K. Pandey", "Pooja Hegde",
    "Mohammed Faisal", "Kavita R. Iyer", "Anand Vardhan", "Divya Deshpande",
    "Siddharth Menon", "Ananya Ghosh", "Prateek Bansal", "Rhea Sengupta",
    "Jaspreet Singh", "Karthik Rajendran", "Neha Malviya", "Vikas Rathod",
    "Anonymous Whistleblower", "Faculty Grievance Welfare Forum", "Concerned Parent Association"
]

def generate_sample_database_records() -> Dict[str, Any]:
    """Generates 40 institutions and ~200 complaints with realistic overlap scenarios."""
    random.seed(42)  # Deterministic seed for reproducible testing
    today = date.today()

    institutions = INSTITUTIONS_DATA

    complaints = []
    case_counter = 1001

    # Hand-craft specific Cross-Bureau Overlap scenarios for presentation demo:
    # Pair 1: Aryavart Institute (ID: 1) -> PGRC Case (Fee extortion) + Regulation Bureau Case (Fee violation)
    # Pair 2: Sahyadri College (ID: 2) -> PGRC Case (Withholding marksheet) + Probable duplicate complaint by another student
    # Pair 3: Malwa Institute (ID: 7) -> Approval Bureau (Unapproved intake) + Regulation Bureau (Affiliation deficit)
    # Pair 4: Cauvery NIT (ID: 3) -> Anti-Ragging Cell + PGRC safety negligence

    for inst_idx, inst in enumerate(institutions, start=1):
        # Generate 4 to 6 complaints per institution (40 * 5 ~= 200)
        num_cases = random.randint(4, 6)

        for case_idx in range(num_cases):
            template = random.choice(COMPLAINT_TEMPLATES)
            
            # Select realistic dates
            # 15% Overdue (received 40 to 90 days ago, due 10 to 30 days ago)
            # 15% Approaching deadline (due in 2 to 6 days)
            # 20% Disposed (resolved in the past)
            # 50% Under process / New
            dice = random.random()
            if dice < 0.16:
                # Overdue case
                received_days_ago = random.randint(35, 75)
                received_d = today - timedelta(days=received_days_ago)
                due_d = today - timedelta(days=random.randint(5, 25))
                status = random.choice(["Under Process", "Action Taken Report Awaited", "Hearing Scheduled", "Pending Bureau Review"])
            elif dice < 0.32:
                # Approaching deadline
                received_days_ago = random.randint(15, 30)
                received_d = today - timedelta(days=received_days_ago)
                due_d = today + timedelta(days=random.randint(2, 6))
                status = random.choice(["Under Process", "Pending Bureau Review"])
            elif dice < 0.52:
                # Disposed case
                received_days_ago = random.randint(60, 120)
                received_d = today - timedelta(days=received_days_ago)
                due_d = received_d + timedelta(days=30)
                status = "Disposed"
            elif dice < 0.65:
                # Transferred or Escalated
                received_days_ago = random.randint(20, 50)
                received_d = today - timedelta(days=received_days_ago)
                due_d = today + timedelta(days=random.randint(10, 25))
                status = random.choice(["Transferred", "Escalated to Committee"])
            else:
                # Normal ongoing case
                received_days_ago = random.randint(5, 25)
                received_d = today - timedelta(days=received_days_ago)
                due_d = today + timedelta(days=random.randint(12, 35))
                status = random.choice(["New", "Under Process", "Hearing Scheduled"])

            bureau = template["bureau"]
            bureau_code = bureau.split()[0].replace("(", "").replace(")", "")
            case_id = f"AICTE-2026-{bureau_code}-{case_counter}"
            case_counter += 1

            complainant = random.choice(COMPLAINANT_NAMES)
            officer = random.choice(OFFICERS_LIST) if status != "New" else "Unassigned"

            complaint_record = {
                "case_id": case_id,
                "institution_id": inst_idx,
                "source_bureau": bureau,
                "complainant_type": "Student" if "Anonymous" not in complainant else "Whistleblower",
                "complainant_name": complainant,
                "category": template["category"],
                "subject": f"{template['subject']} at {inst['name']}",
                "description": f"{template['description']} [Campus Location: {inst['district']}, {inst['state']}].",
                "priority": template["priority"],
                "status": status,
                "assigned_officer": officer,
                "received_date": received_d,
                "due_date": due_d,
                "next_action_due": due_d if status != "Disposed" else None,
                "resolution_summary": (
                    "Inquiry committee completed joint hearing on-site. Penalty imposed on trust, compliance order issued."
                    if status == "Disposed" else None
                ),
                "disposed_date": (due_d - timedelta(days=2)) if status == "Disposed" else None
            }
            complaints.append(complaint_record)

    # Now inject explicit high-profile demo cases for AICTE Officials to demonstrate live!
    # Explicit Overlap 1: Institution 1 (Aryavart) - Cross Bureau between PGRC and RB
    c_demo_1 = {
        "case_id": "AICTE-2026-PGRC-0482",
        "institution_id": 1,
        "source_bureau": "PGRC (Public Grievance Redressal)",
        "complainant_type": "Student",
        "complainant_name": "Rohan Deshpande",
        "category": "Fee Overcharging / Capitation",
        "subject": "Extortionate demand of unapproved development fee and capitation fee at Aryavart Institute",
        "description": "College administration is mandatorily demanding Rs. 75,000 extra in cash under the pretext of 'Campus Development Fee' in violation of AICTE guidelines. Students who refuse to pay are threatened with practical exam debarment.",
        "priority": "Urgent",
        "status": "Under Process",
        "assigned_officer": "Dr. Sunita Sharma (Chief Redressal Officer)",
        "received_date": today - timedelta(days=22),
        "due_date": today + timedelta(days=8),
        "next_action_due": today + timedelta(days=5),
        "resolution_summary": None,
        "disposed_date": None
    }
    c_demo_2 = {
        "case_id": "AICTE-2026-RB-1193",
        "institution_id": 1,
        "source_bureau": "Regulation Bureau (RB)",
        "complainant_type": "Parent",
        "complainant_name": "Dinesh Deshpande",
        "category": "Fee Overcharging / Capitation",
        "subject": "Unauthorized enhancement of annual tuition fee and illegal capitation fee at Aryavart Institute",
        "description": "Formal complaint submitted against the governing trust regarding unauthorized enhancement of tuition fee and Rs. 75,000 cash collection without State Fee Regulatory Committee approval. The college refused to provide receipts.",
        "priority": "Urgent",
        "status": "Under Process",
        "assigned_officer": "Er. Rajesh Verma (Joint Director, Regulation)",
        "received_date": today - timedelta(days=18),
        "due_date": today + timedelta(days=12),
        "next_action_due": today + timedelta(days=7),
        "resolution_summary": None,
        "disposed_date": None
    }
    complaints.insert(0, c_demo_1)
    complaints.insert(1, c_demo_2)

    # Explicit Overlap 2: Institution 2 (Sahyadri) - Probable Duplicate within PGRC
    c_demo_3 = {
        "case_id": "AICTE-2026-PGRC-0511",
        "institution_id": 2,
        "source_bureau": "PGRC (Public Grievance Redressal)",
        "complainant_type": "Student",
        "complainant_name": "Pooja Kulkarni",
        "category": "Withholding Original Certificates",
        "subject": "Illegal withholding of original 10th and 12th certificates on withdrawal at Sahyadri College",
        "description": "The registrar refuses to return original 10th and 12th marksheet certificates despite formal withdrawal within the official AICTE cutoff window. Demanding full remaining 3 years fee.",
        "priority": "Urgent",
        "status": "Under Process",
        "assigned_officer": "Dr. Sunita Sharma (Chief Redressal Officer)",
        "received_date": today - timedelta(days=12),
        "due_date": today + timedelta(days=4),
        "next_action_due": today + timedelta(days=3),
        "resolution_summary": None,
        "disposed_date": None
    }
    c_demo_4 = {
        "case_id": "AICTE-2026-PGRC-0519",
        "institution_id": 2,
        "source_bureau": "PGRC (Public Grievance Redressal)",
        "complainant_type": "Student",
        "complainant_name": "Kulkarni P. (duplicate submission)",
        "category": "Withholding Original Certificates",
        "subject": "Refusal to return original 10th and 12th certificates upon withdrawal at Sahyadri College",
        "description": "The registrar refuses to return original 10th and 12th marksheet certificates despite withdrawal within AICTE cutoff window. Demanding full remaining fee.",
        "priority": "Urgent",
        "status": "Pending Bureau Review",
        "assigned_officer": "Unassigned",
        "received_date": today - timedelta(days=9),
        "due_date": today + timedelta(days=15),
        "next_action_due": today + timedelta(days=10),
        "resolution_summary": None,
        "disposed_date": None
    }
    complaints.insert(2, c_demo_3)
    complaints.insert(3, c_demo_4)

    # Demo users
    users = [
        {
            "username": "admin",
            "full_name": "Dr. K. N. Satyanarayana",
            "email": "admin@aicte-india.org",
            "role": "Administrator",
            "bureau": "All",
            "designation": "AICTE Central Administrator & Member Secretary",
            "password": "Admin@123",
            "complainant_id": None,
            "phone": "+91-11-29581000"
        },
        {
            "username": "reviewer_pgrc",
            "full_name": "Dr. Sunita Sharma",
            "email": "sunita.sharma@aicte-pgrc.gov.in",
            "role": "Reviewer",
            "bureau": "PGRC (Public Grievance Redressal)",
            "designation": "Chief Redressal Officer, PGRC",
            "password": "Reviewer@123",
            "complainant_id": None,
            "phone": "+91-11-29581011"
        },
        {
            "username": "reviewer_rb",
            "full_name": "Er. Rajesh Verma",
            "email": "rajesh.verma@aicte-rb.gov.in",
            "role": "Reviewer",
            "bureau": "Regulation Bureau (RB)",
            "designation": "Joint Director, Regulation Bureau",
            "password": "Reviewer@123",
            "complainant_id": None,
            "phone": "+91-11-29581022"
        },
        {
            "username": "student",
            "full_name": "Priya Nair",
            "email": "priya.nair@dsce.edu.in",
            "role": "Complainant",
            "bureau": "Complainant Portal",
            "designation": "Student (USN: 1DS22CS089)",
            "password": "Student@123",
            "complainant_id": "1DS22CS089",
            "phone": "+91-9845012345"
        },
        {
            "username": "parent",
            "full_name": "Suresh Menon",
            "email": "suresh.menon@gmail.com",
            "role": "Complainant",
            "bureau": "Complainant Portal",
            "designation": "Parent / Guardian",
            "password": "Parent@123",
            "complainant_id": "PAR-984501",
            "phone": "+91-9845099999"
        },
        {
            "username": "viewer",
            "full_name": "Shri Rameshwar Gupta",
            "email": "rameshwar.gupta@gov.in",
            "role": "Viewer",
            "bureau": "All",
            "designation": "Ministry Scrutiny Auditor",
            "password": "Viewer@123",
            "complainant_id": None,
            "phone": "+91-11-29581099"
        }
    ]

    return {
        "institutions": institutions,
        "complaints": complaints,
        "users": users
    }
