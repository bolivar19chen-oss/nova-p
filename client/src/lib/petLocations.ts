// Shared list of pet-related places per city. Used by PetMap (to show them on
// the map) and by ScheduleAppointment / ScheduleVaccine (so the user can pick
// one of these instead of typing a name).
//
// DATOS DE DEMOSTRACION: los nombres son ficticios y las coordenadas son
// aproximadas (ubicadas dentro de barrios reales de cada ciudad para que el
// mapa se vea plausible), NO direcciones verificadas. No usar como guia real
// para llegar a un lugar.

export interface PetLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface CityLocations {
  veterinarians: PetLocation[];
  parks: PetLocation[];
  groomers: PetLocation[];
  petStores: PetLocation[];
  shelters: PetLocation[];
  emergencyClinics: PetLocation[];
}

export const LOCATIONS: Record<string, CityLocations> = {
  "Panama City": {
    veterinarians: [
      { name: "Veterinaria Central", lat: 8.9824, lng: -79.5199 },
      { name: "Pet Care Clinic", lat: 8.9789, lng: -79.5234 },
      { name: "Animal Hospital Bella Vista", lat: 8.9756, lng: -79.5167 },
      { name: "Clinica Veterinaria San Francisco", lat: 8.9812, lng: -79.5023 },
      { name: "Veterinaria Costa del Este", lat: 9.0011, lng: -79.4756 },
      { name: "Hospital Veterinario Punta Pacifica", lat: 8.9701, lng: -79.5089 },
      { name: "Veterinaria El Cangrejo", lat: 8.9887, lng: -79.5301 },
      { name: "Clinica Animal Marbella", lat: 8.9679, lng: -79.5145 },
    ],
    parks: [
      { name: "Parque Metropolitano", lat: 8.9734, lng: -79.5267 },
      { name: "Parque Lefevre", lat: 8.9867, lng: -79.5134 },
      { name: "Parque Omar", lat: 9.0056, lng: -79.4956 },
      { name: "Cinta Costera", lat: 8.9623, lng: -79.5312 },
      { name: "Parque Recreativo Albrook", lat: 8.9745, lng: -79.5567 },
      { name: "Parque Andres Bello", lat: 8.9812, lng: -79.5289 },
      { name: "Parque Urraca", lat: 8.9878, lng: -79.5223 },
      { name: "Malecon Costa del Este", lat: 9.0089, lng: -79.4712 },
    ],
    groomers: [
      { name: "Pet Spa", lat: 8.9845, lng: -79.5212 },
      { name: "Grooming Plus", lat: 8.9801, lng: -79.5189 },
      { name: "Estetica Canina Obarrio", lat: 8.9856, lng: -79.5178 },
      { name: "Spa Felino San Francisco", lat: 8.9834, lng: -79.5045 },
      { name: "Grooming Express Marbella", lat: 8.9678, lng: -79.5156 },
      { name: "Pet Style Costa del Este", lat: 9.0023, lng: -79.4778 },
      { name: "Peluqueria Canina El Dorado", lat: 9.0134, lng: -79.5389 },
      { name: "Bella Mascota Grooming", lat: 8.9912, lng: -79.5267 },
    ],
    petStores: [
      { name: "PetLandia", lat: 8.9798, lng: -79.5223 },
      { name: "SuperMascotas Albrook", lat: 8.9756, lng: -79.5589 },
      { name: "La Casa del Perro", lat: 8.9867, lng: -79.5178 },
      { name: "PetShop Costa del Este", lat: 9.0045, lng: -79.4734 },
      { name: "Mundo Animal San Francisco", lat: 8.9823, lng: -79.5056 },
      { name: "Tienda Naturaleza Mascota", lat: 8.9689, lng: -79.5289 },
      { name: "PetCenter Multiplaza", lat: 8.9701, lng: -79.5123 },
      { name: "Almacen Mascotas Felices", lat: 8.9945, lng: -79.5312 },
    ],
    shelters: [
      { name: "Refugio Patitas sin Hogar", lat: 9.0123, lng: -79.5445 },
      { name: "Fundacion Adopta Panama", lat: 8.9634, lng: -79.5378 },
      { name: "Refugio Amigos de las Mascotas", lat: 8.9567, lng: -79.5523 },
      { name: "Casa Hogar Animal", lat: 9.0089, lng: -79.5234 },
      { name: "Refugio Huellas de Esperanza", lat: 8.9445, lng: -79.5612 },
      { name: "Centro de Adopcion Municipal", lat: 8.9712, lng: -79.5445 },
      { name: "Refugio San Francisco de Asis", lat: 8.9834, lng: -79.5601 },
      { name: "Fundacion Rescate Animal Panama", lat: 9.0201, lng: -79.5089 },
    ],
    emergencyClinics: [
      { name: "Emergencias Veterinarias 24H Panama", lat: 8.9789, lng: -79.5145 },
      { name: "Hospital Veterinario de Urgencias", lat: 8.9912, lng: -79.5223 },
      { name: "Clinica Veterinaria 24 Horas El Dorado", lat: 9.0089, lng: -79.5356 },
      { name: "Emergencia Animal Costa del Este", lat: 9.0012, lng: -79.4801 },
      { name: "Centro Veterinario de Emergencias Marbella", lat: 8.9656, lng: -79.5178 },
      { name: "Urgencias Veterinarias Albrook", lat: 8.9723, lng: -79.5534 },
      { name: "Hospital Animal 24H San Francisco", lat: 8.9845, lng: -79.5012 },
      { name: "Clinica de Emergencias Betania", lat: 8.9534, lng: -79.5389 },
    ],
  },
  "La Chorrera": {
    veterinarians: [
      { name: "Veterinaria La Chorrera", lat: 8.9123, lng: -79.6234 },
      { name: "Pet Clinic Chorrera", lat: 8.9156, lng: -79.6189 },
      { name: "Clinica Veterinaria San Antonio", lat: 8.8934, lng: -79.6312 },
      { name: "Hospital Animal Barrio Colon", lat: 8.9078, lng: -79.6156 },
    ],
    parks: [
      { name: "Parque La Chorrera", lat: 8.9145, lng: -79.6267 },
      { name: "Parque Central Chorrera", lat: 8.9089, lng: -79.6198 },
      { name: "Parque Recreativo Amador", lat: 8.8967, lng: -79.6345 },
    ],
    groomers: [
      { name: "Grooming Chorrera", lat: 8.9134, lng: -79.6212 },
      { name: "Pet Spa Chorrera", lat: 8.9067, lng: -79.6178 },
      { name: "Estetica Canina Amador", lat: 8.9198, lng: -79.6289 },
    ],
    petStores: [
      { name: "Tienda Mascotas Chorrera", lat: 8.9112, lng: -79.6245 },
      { name: "PetShop San Antonio", lat: 8.8956, lng: -79.6301 },
      { name: "Mundo Animal Chorrera", lat: 8.9189, lng: -79.6167 },
    ],
    shelters: [
      { name: "Refugio Chorrera", lat: 8.9034, lng: -79.6389 },
      { name: "Fundacion Adopta Chorrera", lat: 8.8889, lng: -79.6423 },
      { name: "Casa Hogar Animal Chorrera", lat: 8.9223, lng: -79.6301 },
    ],
    emergencyClinics: [
      { name: "Emergencias Veterinarias Chorrera", lat: 8.9098, lng: -79.6212 },
      { name: "Clinica 24H Chorrera", lat: 8.9156, lng: -79.6334 },
      { name: "Hospital Animal Urgencias Chorrera", lat: 8.8945, lng: -79.6178 },
    ],
  },
};

export const getCityLocations = (city?: string): CityLocations => LOCATIONS[city || ""] || LOCATIONS["Panama City"];
