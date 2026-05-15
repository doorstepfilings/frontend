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
    image: "/assets/images/testimonials/optimized/01.png",
    name: "Pankaj Patel",
    designation: "Partner, Emkay Packaging",
    quote:
      "The team made our registration and compliance work simple, quick, and dependable from day one.",
    imagePosition: "center 24%",
  },
  {
    image: "/assets/images/testimonials/optimized/02.png",
    name: "Mukesh Patel",
    designation: "Director, Flexibond Industries Pvt. Ltd.",
    quote:
      "Clear guidance, timely updates, and practical support helped us stay focused on running the business.",
    imagePosition: "center 20%",
  },
  {
    image: "/assets/images/testimonials/optimized/03.png",
    name: "Umang Patel",
    designation: "Director, Arise Company Pvt. Ltd.",
    quote:
      "Their doorstep service and responsive communication made the entire filing process smooth and stress-free.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/optimized/04.png",
    name: "Rakesh Patel",
    designation: "Director, Umiya Alloys Pvt. Ltd.",
    quote:
      "We appreciate the professional approach, transparent communication, and consistent follow-through on every task.",
    imagePosition: "center 14%",
  },
  {
    image: "/assets/images/testimonials/optimized/05.png",
    name: "Bhupendra Patel",
    designation: "Partner, Umiya Developers Arise Group",
    quote:
      "From documentation to compliance reminders, everything was handled with care, clarity, and accuracy.",
    imagePosition: "center 20%",
  },
  {
    image: "/assets/images/testimonials/optimized/06.png",
    name: "Suresh Parmar",
    designation: "Partner, Aadhyshakti International LLP",
    quote:
      "A reliable partner for day-to-day compliance needs, with quick answers whenever we needed support.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/optimized/07.png",
    name: "Hardik Upadhyay",
    designation: "Partner, Kanhai Engineers LLP",
    quote:
      "The process felt organized, efficient, and easy to understand at every stage of the engagement.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/optimized/08.png",
    name: "Vijay Kariya",
    designation: "Partner, Ramniklal Jamnadas LLP",
    quote:
      "They simplified complex paperwork and helped us move faster with complete peace of mind.",
    imagePosition: "center 20%",
  },
  {
    image: "/assets/images/testimonials/optimized/09.png",
    name: "Vishal Gupta",
    designation: "Proprietor, Yug Alloys",
    quote:
      "Good service, fast turnaround, and a team that genuinely understands business requirements.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/optimized/10.png",
    name: "Anil Patel",
    designation: "Partner, Shukan Metal",
    quote:
      "Their support has been practical, prompt, and very helpful for our ongoing statutory work.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/optimized/11.png",
    name: "Dinesh Barot",
    designation: "Partner, Steel Solution",
    quote:
      "Professional handling and consistent communication made the experience smooth from start to finish.",
    imagePosition: "center 18%",
  },
  {
    image: "/assets/images/testimonials/optimized/12.png",
    name: "Sanjeev Saggi",
    designation: "Director, Crystal Foundry Fluxes Pvt. Ltd.",
    quote:
      "We value the clarity, accountability, and dependable service their team brings to our business.",
    imagePosition: "center 16%",
  },
  {
    image: "/assets/images/testimonials/optimized/13.png",
    name: "Harish Choudhary",
    designation: "United Tyre Group",
    quote:
      "A trustworthy team for compliance and advisory support, with a strong focus on timeliness and follow-up.",
    imagePosition: "center 14%",
  },
];

export const homeHeroAvatars = homeTestimonials.slice(0, 4).map((testimonial) => ({
  src: testimonial.image,
  alt: testimonial.name,
  imagePosition: testimonial.imagePosition,
}));
