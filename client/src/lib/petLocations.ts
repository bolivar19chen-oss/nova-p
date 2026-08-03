// Shared list of nearby veterinarians, parks and groomers per city.
// Used by both PetMap (to show them on the map) and ScheduleAppointment
// (so the user can pick one of these real clinics instead of typing a name).

export interface PetLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface CityLocations {
  veterinarians: PetLocation[];
  parks: PetLocation[];
  groomers: PetLocation[];
}

export const LOCATIONS: Record<string, CityLocations> = {
  "Panama City": {
    veterinarians: [
      { name: "Veterinaria Central", lat: 8.9824, lng: -79.5199 },
      { name: "Pet Care Clinic", lat: 8.9789, lng: -79.5234 },
      { name: "Animal Hospital", lat: 8.9756, lng: -79.5167 },
    ],
    parks: [
      { name: "Parque Metropolitano", lat: 8.9734, lng: -79.5267 },
      { name: "Parque Lefevre", lat: 8.9867, lng: -79.5134 },
    ],
    groomers: [
      { name: "Pet Spa", lat: 8.9845, lng: -79.5212 },
      { name: "Grooming Plus", lat: 8.9801, lng: -79.5189 },
    ],
  },
  "La Chorrera": {
    veterinarians: [
      { name: "Veterinaria La Chorrera", lat: 8.9123, lng: -79.6234 },
      { name: "Pet Clinic Chorrera", lat: 8.9156, lng: -79.6189 },
    ],
    parks: [{ name: "Parque La Chorrera", lat: 8.9145, lng: -79.6267 }],
    groomers: [{ name: "Grooming Chorrera", lat: 8.9134, lng: -79.6212 }],
  },
};

export const getCityLocations = (city?: string): CityLocations => LOCATIONS[city || ""] || LOCATIONS["Panama City"];
