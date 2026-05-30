export type CountryOption = {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
};

export const AUTH_COUNTRIES: CountryOption[] = [
  { iso: "in", name: "India", dialCode: "91", flag: "https://flagcdn.com/24x18/in.png" },
  { iso: "us", name: "United States", dialCode: "1", flag: "https://flagcdn.com/24x18/us.png" },
  { iso: "gb", name: "United Kingdom", dialCode: "44", flag: "https://flagcdn.com/24x18/gb.png" },
  { iso: "ae", name: "United Arab Emirates", dialCode: "971", flag: "https://flagcdn.com/24x18/ae.png" },
  { iso: "sa", name: "Saudi Arabia", dialCode: "966", flag: "https://flagcdn.com/24x18/sa.png" },
  { iso: "kw", name: "Kuwait", dialCode: "965", flag: "https://flagcdn.com/24x18/kw.png" },
  { iso: "qa", name: "Qatar", dialCode: "974", flag: "https://flagcdn.com/24x18/qa.png" },
  { iso: "au", name: "Australia", dialCode: "61", flag: "https://flagcdn.com/24x18/au.png" },
  { iso: "ca", name: "Canada", dialCode: "1", flag: "https://flagcdn.com/24x18/ca.png" },
  { iso: "de", name: "Germany", dialCode: "49", flag: "https://flagcdn.com/24x18/de.png" },
  { iso: "fr", name: "France", dialCode: "33", flag: "https://flagcdn.com/24x18/fr.png" },
  { iso: "jp", name: "Japan", dialCode: "81", flag: "https://flagcdn.com/24x18/jp.png" },
  { iso: "sg", name: "Singapore", dialCode: "65", flag: "https://flagcdn.com/24x18/sg.png" },
];
