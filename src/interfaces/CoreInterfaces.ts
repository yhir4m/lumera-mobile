
export type AnimalSex = 'MALE' | 'FEMALE' | string;
export type AnimalStatus = 'ACTIVE' | 'SOLD' | 'DEAD' | string;
export type AnimalOrigin = 'BORN_ON_FARM' | 'PURCHASED' | string;
export type AnimalType = 'VACA' | 'BECERRO' | 'TORO' | string;
export type OwnershipType = 'OWNED' | 'LEASED' | string;

export namespace Core {
  export interface Organization {
    org_id: string;
    org_name: string;
    role: string;
  }

  export interface SelectOrgRequest {
    org_id: string;
  }

  export interface SelectOrgResponse {
    access_token: string;
    active_org: Organization;
  }

  export interface Address {
    street: string;
    city: string;
    state: string;
    country: string;
  }

  export interface ProductionUnit {
    id: string;
    name: string;
    address: Address;
    membership?: {
      joined_at: string;
      status: 'active' | 'inactive' | string;
    };
  }

  export interface ProductionUnitDetail extends ProductionUnit {
    locations: Location[];
  }

  export interface ProductionUnitCreateInput {
    name: string;
    address: Address;
  }

  export interface Animals {
    animals: Animal[];
  }

  export interface Location {
    location_id: string;
    name: string;
    type: 'paddock' | 'corral' | string;
  }

  export interface LocationCreateInput {
    name: string;
    type: 'paddock' | 'corral' | string;
  }

  export interface CatalogItem {
    id: string;
    name: string;
    species_id?: string;
  }

  //sujeto a cambios, los tipos no son definitivos
export interface Animal {
  id: string | number;
  item_type?: 'animal' | 'lot';
  animal_id?: string | null;
  lot_id?: string | null;
  organization_id?: string;
  production_unit_id?: string;
  identifier?: string;
  display_name?: string | null;
  name?: string | null;
  tag_number?: string | null;
  siniiga_tag?: string | null;
  birth_date?: string | null;
  sex?: 'male' | 'female' | 'unknown' | string;
  origin?: string;
  ownership_type?: string | null;
  purpose?: string | null;
  purity?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  notes?: string | null;
  status?: string;
  nombre?: string;
  edad?: number;
  animalType?: AnimalType;
  Color?: string;
  Pierna1?: string;
  Pieran2?: string;
  Serie1?: string;
  Serie2?: string;
  Arete?: string;
  fechaNacimiento?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

  export interface AnimalCreateInput {
    tag_number: string;
    name?: string;
    species_id: string;
    breed_id: string;
    location_id?: string;
    birth_date?: string;
    gender: 'M' | 'F';
    weight?: number;
  }

  export interface SanitaryEvent {
    id: string;
    animal_id: string;
    event_type: string;
    description: string;
    applied_date: string;
    status: 'pending' | 'applied' | 'rejected';
    created_at: string;
    updated_at: string;
    idempotency_key?: string;
  }

  export interface SanitaryEventCreateInput {
    animal_id: string;
    event_type: string;
    description: string;
    applied_date: string;
    idempotency_key: string; // Used to prevent duplicates on mobile retry
  }

  export interface OrgPermissionsResponse {
    role: string;
    permissions: string[];
  }
}
