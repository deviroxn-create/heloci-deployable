export type LandingImage = {
  src: string;
  alt: string;
};

export const HERO_IMAGES: LandingImage[] = [
  { src: "/images/hero/hero-1-people.jpg.jpg", alt: "Family outside a welcoming home" },
  { src: "/images/hero/hero-2-home.jpg.jpg", alt: "Welcoming home interior prepared for a family" },
  { src: "/images/hero/hero-3-community.jpg.jpg", alt: "People connecting in a supportive community" },
  { src: "/images/hero/hero-4-interior.jpg.jpg", alt: "Bright, comfortable home interior" }
];

export const MISSION_IMAGE: LandingImage = {
  src: "/images/mission/community-1.jpg",
  alt: "People connecting in a welcoming community space"
};
