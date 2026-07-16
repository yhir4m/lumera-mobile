import { apiClient } from '../../lib/apiClient';
import { Core } from '../../interfaces/CoreInterfaces';
import { AxiosResponse } from 'axios';
import { withLoader } from '../../context/LoaderContext';
import { supabase } from '../../lib/supabase';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function mapAnimalFromApi(animal: any): Core.Animal {
  const itemType = animal.itemType === 'lot' ? 'lot' : 'animal';
  const animalId = animal.animalId ?? null;
  const lotId = animal.lotId ?? null;
  const id = itemType === 'animal' ? (animalId || lotId) : (lotId || animalId);

  return {
    id,
    item_type: itemType,
    animal_id: animalId,
    lot_id: lotId,
    organization_id: animal.organizationId,
    production_unit_id: animal.productionUnitId,
    identifier: animal.identifier,
    display_name: animal.displayName,
    status: animal.status || 'active',
    created_at: animal.createdAt || new Date().toISOString(),
    name: animal.name,
    tag_number: animal.tagNumber,
    siniiga_tag: animal.siniigaTag,
    birth_date: animal.birthDate,
    sex: animal.sex,
    origin: animal.origin,
    ownership_type: animal.ownershipType,
    purpose: animal.purpose,
    purity: animal.purity,
    sire_id: animal.sireId,
    dam_id: animal.damId,
    notes: animal.notes,
    updated_at: animal.updatedAt || animal.createdAt || new Date().toISOString(),
  };
}

function resolveAnimalPatchId(animal: Core.Animal): string {
  if (animal.item_type === 'lot') {
    throw new Error('Los lotes no se pueden editar con este endpoint. Usa un registro de tipo animal.');
  }

  const targetId = animal.animal_id || String(animal.id);
  if (!targetId) {
    throw new Error('No se encontró el ID del animal para actualizar.');
  }

  return targetId;
}

function buildAnimalUpdateBody(data: any) {
  return {
    identifier: data.identifier,
    displayName: data.display_name,
    name: data.name,
    tagNumber: data.tag_number,
    siniigaTag: data.siniiga_tag,
    birthDate: data.birth_date,
    sex: data.sex,
    origin: data.origin,
    ownershipType: data.ownership_type,
    purpose: data.purpose,
    purity: data.purity,
    notes: data.notes,
  };
}

// Helper to create a mocked AxiosResponse
const createMockResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

export const coreService = {
  // --- Organizations & Roles ---

  getUserOrganizations: async (): Promise<AxiosResponse<Core.Organization[]>> => {
    console.log('organi')
    const response = await apiClient.get('/organizations');
    
    console.log(response,'organi')
    // Map backend array { id, name, status, role, createdAt } to legacy UI { org_id, org_name, role }
    const orgs = (response.data.organizations || []).map((org: any) => ({
      org_id: org.id,
      org_name: org.name,
      role: org.role || 'member'
    }));

    return {
      ...response,
      data: orgs
    };
  },

  createOrganization: async (name: string): Promise<AxiosResponse<Core.Organization>> => {
    const response = await apiClient.post('/organizations', { name });
    
    // Map response back to Core.Organization:
    const org = response.data;
    const mapped: Core.Organization = {
      org_id: org.id,
      org_name: org.name,
      role: org.role || 'admin'
    };

    return {
      ...response,
      data: mapped
    };
  },

  getOrganizationPermissions: async (orgId: string): Promise<AxiosResponse<Core.OrgPermissionsResponse>> => {
    const response = await apiClient.get(`/organizations/${orgId}/permissions/me`);
    return response;
  },

  selectOrganization: async (orgId: string): Promise<AxiosResponse<Core.SelectOrgResponse>> => {
    // 1. Verify permissions dynamically using real API
    const permRes = await coreService.getOrganizationPermissions(orgId);
    
    // 2. Fetch the organization info to build SelectOrgResponse
    const orgsRes = await coreService.getUserOrganizations();
    const matchedOrg = orgsRes.data.find(o => o.org_id === orgId);
    const active_org = {
      org_id: orgId,
      org_name: matchedOrg ? matchedOrg.org_name : 'Organización Seleccionada',
      role: permRes.data.role || 'member'
    };

    // 3. Update org context in session WITHOUT overwriting the real JWT token
    const { data: sessionData } = await supabase.auth.getSession();
    const currentToken = sessionData?.session?.access_token || '';
    if (sessionData?.session) {
      // Preserve the real JWT — only update org metadata
      sessionData.session.user.user_metadata = {
        ...sessionData.session.user.user_metadata,
        active_org_id: orgId,
        active_org
      };
      if (typeof (supabase.auth as any).updateSession === 'function') {
        await (supabase.auth as any).updateSession(sessionData.session);
      }
    }

    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
      data: {
        access_token: currentToken,
        active_org
      }
    };
  },

  // --- Production Units ---

  getProductionUnits: async (orgId: string): Promise<AxiosResponse<Core.ProductionUnit[]>> => {
    const response = await apiClient.get(`/organizations/${orgId}/production-units`);
    
    // Map backend array { id, organizationId, name, livestockType, region, status, createdAt }
    // to legacy UI structure { id, name, address, membership }
    const units = (response.data.productionUnits || []).map((pu: any) => ({
      id: pu.id,
      name: pu.name,
      address: {
        street: pu.region || 'Sin dirección',
        city: '',
        state: '',
        country: ''
      },
      membership: {
        joined_at: pu.createdAt || new Date().toISOString(),
        status: pu.status || 'active'
      }
    }));

    return {
      ...response,
      data: units
    };
  },

  createProductionUnit: async (orgId: string, data: Core.ProductionUnitCreateInput): Promise<AxiosResponse<Core.ProductionUnit>> => {
    const backendBody = {
      name: data.name,
      speciesCodes: ['bovino'],
      region: data.address ? `${data.address.street}, ${data.address.city}`.replace(/(^,)|(,$)/g, '').trim() : ''
    };
    const response = await apiClient.post(`/organizations/${orgId}/production-units`, backendBody);
    
    const pu = response.data;
    const mapped: Core.ProductionUnit = {
      id: pu.id,
      name: pu.name,
      address: {
        street: pu.region || 'Sin dirección',
        city: '',
        state: '',
        country: ''
      },
      membership: {
        joined_at: pu.createdAt || new Date().toISOString(),
        status: pu.status || 'active'
      }
    };

    return {
      ...response,
      data: mapped
    };
  },

  getProductionUnitDetail: async (orgId: string, puId: string): Promise<AxiosResponse<Core.ProductionUnitDetail>> => {
    const response = await apiClient.get(`/organizations/${orgId}/production-units/${puId}`);
    
    const pu = response.data;
    const mapped: Core.ProductionUnitDetail = {
      id: pu.id,
      name: pu.name,
      address: {
        street: pu.region || 'Sin dirección',
        city: '',
        state: '',
        country: ''
      },
      membership: {
        joined_at: pu.createdAt || new Date().toISOString(),
        status: pu.status || 'active'
      },
      locations: [
        { location_id: 'loc_1', name: 'Potrero Grande', type: 'paddock' },
        { location_id: 'loc_2', name: 'Corral de Manejo', type: 'corral' }
      ]
    };

    return {
      ...response,
      data: mapped
    };
  },

  getProductionUnitDetails: async (puId: string): Promise<AxiosResponse<Core.ProductionUnitDetail>> =>
    withLoader(async () => {
      await delay(800);
      return createMockResponse({
        id: puId,
        name: puId === '<z>u_norte' ? 'Unidad Productiva Norte' : 'Unidad Productiva Sur',
        address: { street: 'Km 15 Carr. Norte', city: 'Villahermosa', state: 'Tabasco', country: 'México' },
        locations: [
          { location_id: 'loc_1', name: 'Potrero Grande', type: 'paddock' },
          { location_id: 'loc_2', name: 'Corral de Manejo', type: 'corral' }
        ]
      });
    }),

  // --- Production Units animals ---

  getProductionUnitsAnimals: async (orgId: string, puId: string): Promise<AxiosResponse<Core.Animal[]>> =>
    withLoader(async () => {
      await delay(800);
      return createMockResponse([
        {
          id: Math.random()*10000000,
          nombre:"tilin",
          edad: 2,
          fechaNacimiento: '2024-03-15',
          animalType: 'VACA',
          Color: 'Blanco con Negro',
          Pierna1: 'Hierro 1',
          Pieran2: 'Hierro 2',
          Serie1: '12345',
          Serie2: '67890',
          Arete: 'TAG-001',
          created_by: 'user_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: Math.random()*10000000,
          nombre:"tilin2",
          edad: 3,
          fechaNacimiento: '2023-11-20',
          animalType: 'TORO',
          Color: 'Café',
          Pierna1: 'Hierro A',
          Pieran2: 'Hierro B',
          Serie1: '54321',
          Serie2: '09876',
          Arete: 'TAG-002',
          created_by: 'user_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    }),

  // --- Locations ---

  getLocations: async (orgId: string, puId: string): Promise<AxiosResponse<Core.Location[]>> => {
    const response: AxiosResponse<Core.Location[]> = await apiClient.get(`/organizations/${orgId}/production-units/${puId}/locations`);
    return response;
  },

  createLocation: async (orgId: string, puId: string, data: Core.LocationCreateInput): Promise<AxiosResponse<Core.Location>> => {
    const response: AxiosResponse<Core.Location> = await apiClient.post(`/organizations/${orgId}/production-units/${puId}/locations`, data);
    return response;
  },

  // --- Catalogs ---

  getSpecies: async (): Promise<AxiosResponse<Core.CatalogItem[]>> => {
    const response: AxiosResponse<Core.CatalogItem[]> = await apiClient.get('/catalogs/species');
    return response;
  },

  getBreeds: async (speciesId: string): Promise<AxiosResponse<Core.CatalogItem[]>> => {
    const response: AxiosResponse<Core.CatalogItem[]> = await apiClient.get('/catalogs/breeds', {
      params: { species_id: speciesId }
    });
    return response;
  },

  getProductionTypes: async (): Promise<AxiosResponse<Core.CatalogItem[]>> => {
    const response: AxiosResponse<Core.CatalogItem[]> = await apiClient.get('/catalogs/production-types');
    return response;
  },

  // --- Animals ---

  // --- Animals ---

  getAnimals: async (orgId: string, puId: string): Promise<AxiosResponse<Core.Animal[]>> => {
    const response = await apiClient.get('/animals', {
      params: { organizationId: orgId, productionUnitId: puId }
    });

    const mapped = (response.data.animals || []).map(mapAnimalFromApi);

    return {
      ...response,
      data: mapped
    };
  },

  createAnimal: async (orgId: string, puId: string, data: any): Promise<AxiosResponse<Core.Animal>> => {
    const backendBody = {
      itemType: "animal",
      identifier: data.identifier,
      displayName: data.display_name,
      name: data.name,
      tagNumber: data.tag_number,
      siniigaTag: data.siniiga_tag,
      birthDate: data.birth_date,
      sex: data.sex,
      origin: data.origin,
      ownershipType: data.ownership_type,
      purpose: data.purpose,
      purity: data.purity,
      notes: data.notes
    };

    const response = await apiClient.post('/animals', backendBody, {
      params: { organizationId: orgId, productionUnitId: puId }
    });

    const mapped = mapAnimalFromApi(response.data);

    return {
      ...response,
      data: mapped
    };
  },

  updateAnimal: async (orgId: string, puId: string, animal: Core.Animal, data: any): Promise<AxiosResponse<Core.Animal>> => {
    console.log(orgId,puId,animal,data,'plñ')
    const targetId = resolveAnimalPatchId(animal);
    const backendBody = buildAnimalUpdateBody(data);
    console.log(targetId,backendBody,'targetId,backendBody')
    const response = await apiClient.patch(`/animals/${targetId}`, backendBody, {
      params: { organizationId: orgId, productionUnitId: puId }
    });
    console.log(response.data,'response.data')
    const mapped = mapAnimalFromApi(response.data);

    return {
      ...response,
      data: mapped
    };
  },

  archiveAnimal: async (orgId: string, puId: string, animal: Core.Animal): Promise<AxiosResponse<any>> => {
    const targetId = resolveAnimalPatchId(animal);
    const response = await apiClient.post(`/animals/${targetId}/archive`, {}, {
      params: { organizationId: orgId, productionUnitId: puId }
    });
    return response;
  },

  // --- Sanitary Events ---

  getSanitaryEvents: async (orgId: string, animalId: string): Promise<AxiosResponse<Core.SanitaryEvent[]>> => {
    const response: AxiosResponse<Core.SanitaryEvent[]> = await apiClient.get(`/organizations/${orgId}/animals/${animalId}/sanitary-events`);
    return response;
  },

  createSanitaryEvent: async (orgId: string, animalId: string, data: Core.SanitaryEventCreateInput): Promise<AxiosResponse<Core.SanitaryEvent>> => {
    const response: AxiosResponse<Core.SanitaryEvent> = await apiClient.post(`/organizations/${orgId}/animals/${animalId}/sanitary-events`, data);
    return response;
  },
};
