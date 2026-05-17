export interface TestimonialEntry {
  image: string;
  name: string;
  designation: string;
  quote: string;
  imagePosition?: string;
}

// Placeholder copy based on the client list from the shared document.
// Swap these quotes with approved client feedback whenever it is available.
export const homeTestimonials: ReadonlyArray<TestimonialEntry> = [
  
{
    image: "/assets/images/testimonials/Umang_Arise.png",
    name: "Umang Patel",
    designation: "Director, Arise Company Pvt. Ltd.",
    quote:
      "Their doorstep service and responsive communication made the entire filing process smooth and stress-free.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/Milap_Peripheral.png",
    name: "Milap Mehta",
    designation: "Directors of Mehta Peripheral & Computer Pvt Ltd.",
    quote:
      "Their doorstep service and responsive communication made the entire filing process smooth and stress-free.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/rakesh_umiya_alloys.png",
    name: "Rakesh Patel",
    designation: "Director, Umiya Alloys Pvt. Ltd.",
    quote:
      "We appreciate the professional approach, transparent communication, and consistent follow-through on every task.",
    imagePosition: "center 14%",
  },
    {
    image: "/assets/images/testimonials/Hardik_Kanhai.png",
    name: "Hardik Upadhyay",
    designation: "Partner, Kanhai Engineers LLP",
    quote:
      "The process felt organized, efficient, and easy to understand at every stage of the engagement.",
    imagePosition: "center 18%",
  },
   {
    image: "/assets/images/testimonials/Vishal_Yug_Alloys.png",
    name: "Vishal Gupta",
    designation: "Proprietor, Yug Alloys",
    quote:
      "Good service, fast turnaround, and a team that genuinely understands business requirements.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/Bhupendra_Umiya.png",
    name: "Bhupendra Patel",
    designation: "Partner, Umiya Developers Arise Group",
    quote:
      "From documentation to compliance reminders, everything was handled with care, clarity, and accuracy.",
    imagePosition: "center 20%",
  },
  {
    image: "/assets/images/testimonials/Suresh_Aadhyshakti.png",
    name: "Suresh Parmar",
    designation: "Partner, Aadhyshakti International LLP",
    quote:
      "A reliable partner for day-to-day compliance needs, with quick answers whenever we needed support.",
    imagePosition: "center 18%",
  },
    {
    image: "/assets/images/testimonials/Pankaj_Emkay.png",
    name: "Pankaj Patel",
    designation: "Partner, Emkay Packaging",
    quote:
      "The team made our registration and compliance work simple, quick, and dependable from day one.",
    imagePosition: "center 24%",
  },
  {
    image: "/assets/images/testimonials/Anil_Shukan_Metal.png",
    name: "Anil Patel",
    designation: "Partner, Shukan Metal",
    quote:
      "Their support has been practical, prompt, and very helpful for our ongoing statutory work.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/Dinesh_Steel.png",
    name: "Dinesh Barot",
    designation: "Partner, Steel Solution",
    quote:
      "Professional handling and consistent communication made the experience smooth from start to finish.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/Sanjeev_Crystal.png",
    name: "Sanjeev Saggi",
    designation: "Director, Crystal Foundry Fluxes Pvt. Ltd.",
    quote:
      "We value the clarity, accountability, and dependable service their team brings to our business.",
    imagePosition: "center 16%",
  },
  {
    image: "/assets/images/testimonials/Harish_United_Tyre.png",
    name: "Harish Choudhary",
    designation: "United Tyre Group",
    quote:
      "A trustworthy team for compliance and advisory support, with a strong focus on timeliness and follow-up.",
    imagePosition: "center 14%",
  },
  {
    image: "/assets/images/testimonials/Ravishankar_Water_Coat.png",
    name: "Ravishankar Shukla",
    designation: "Directors of Shukla Water-Coat Industries Pvt Ltd",
    quote:
      "Professional support, dependable communication, and doorstep assistance made every compliance step easier for our team.",
    imagePosition: "center",
  },
  {
    image: "/assets/images/testimonials/Sagar_Nesrise.png",
    name: "Sagar Chaudhary",
    designation: "Director, Nesrise Services Pvt. Ltd.",
    quote:
      "The process was handled with clarity and speed, which helped us stay focused on operations without unnecessary follow-ups.",
    imagePosition: "center",
  },
  {
    image: "/assets/images/testimonials/Prem_Singh.png",
    name: "Prem sing Road",
    designation: "Pro. Chamunda Steel Centre",
    quote:
      "Timely updates, practical guidance, and reliable execution gave us confidence throughout our business compliance work.",
    imagePosition: "center",
  },
  {
    image: "/assets/images/testimonials/Ghanshyam_Sairam.png",
    name: "Ghanshyam Patel",
    designation: "Prop. Sairam Trading Co",
    quote:
      "Clear communication, prompt execution, and dependable support made every compliance requirement simple to manage.",
    imagePosition: "center",
  },
];

export const homeHeroAvatars = homeTestimonials.slice(0, 5).map((testimonial) => ({
  src: testimonial.image,
  alt: testimonial.name,
  imagePosition: testimonial.imagePosition,
}));
