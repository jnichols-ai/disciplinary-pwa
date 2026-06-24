export interface ManagerOffice {
  manager: string;
  state: string;
  office: string;
  address: string;
  phone: string;
}

export const MANAGER_OFFICES: ManagerOffice[] = [
  { manager: "Josh Emerson", state: "MD", office: "Baltimore", address: "3921 Vero Rd Suite B, Baltimore, MD 21227", phone: "443-884-5581" },
  { manager: "Jay Brooks", state: "MD", office: "Bowie", address: "5810 Woodcliff Rd #103, Bowie, MD 20720", phone: "877-378-7280" },
  { manager: "Sloane Strus", state: "MD", office: "Salisbury", address: "2120 Windsor Drive Unit E, Salisbury, MD 21801", phone: "443-884-5577" },
  { manager: "Mike Battle", state: "MD", office: "White Plains", address: "4425 Southern Business Park Dr, White Plains, MD 20695", phone: "877-378-7280" },
  { manager: "Charles Runyon", state: "MD", office: "Williamsport", address: "10212 Governor Lane Boulevard Suite 1001, Williamsport, MD 21795", phone: "877-378-7280" },
  { manager: "Derrick Boodhoo", state: "VA", office: "Manassas", address: "8733 Quarry Rd Suite 101, Manassas, VA 20110", phone: "877-378-7280" },
  { manager: "Roger Runyon", state: "VA", office: "Richmond", address: "6836 Atmore Dr, Richmond, VA 23225", phone: "443-884-9713" },
  { manager: "Eddie Thomas", state: "DE", office: "Dover", address: "131 Rosemary Rd, Dover, DE 19901", phone: "443-884-5571" },
  { manager: "John Barnett", state: "TN", office: "Brentwood", address: "500 Wilson Pike Cir, Brentwood, TN 37027", phone: "443-330-2079" },
  { manager: "Justin Nichols", state: "UT", office: "Orem", address: "63 W University Pkwy, Orem, UT 84058-7333", phone: "877-378-7280" },
  { manager: "Ben Boyle", state: "UT", office: "Orem", address: "63 W University Pkwy, Orem, UT 84058-7333", phone: "877-378-7280" },
  { manager: "Blair Watkins", state: "UT", office: "Orem", address: "63 W University Pkwy, Orem, UT 84058-7333", phone: "877-378-7280" },
  { manager: "Abby Burt", state: "UT", office: "Orem", address: "63 W University Pkwy, Orem, UT 84058-7333", phone: "877-378-7280" },
  { manager: "Dustin Coleny", state: "VA", office: "Manassas", address: "8733 Quarry Rd Suite 101, Manassas, VA 20110", phone: "877-378-7280" },
  { manager: "Jahmaine Powell", state: "MD", office: "White Plains", address: "4425 Southern Business Park Dr, White Plains, MD 20695", phone: "877-378-7280" },
  { manager: "Kean Shanahan", state: "DE", office: "Dover", address: "131 Rosemary Rd, Dover, DE 19901", phone: "443-884-5571" },
];

export function findManagerOffice(managerName: string): ManagerOffice | undefined {
  return MANAGER_OFFICES.find((m) => m.manager === managerName);
}
