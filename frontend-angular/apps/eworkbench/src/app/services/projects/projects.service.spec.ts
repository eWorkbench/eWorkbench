/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';
import { mockProject, mockProjectMember, mockProjectRelation, mockProjectRelationPayload, mockProjectsList } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ProjectsService } from './projects.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';

describe('ProjectsService', () => {
  let spectator: SpectatorHttp<ProjectsService>;
  const createService = createHttpFactory({
    service: ProjectsService,
    providers: [
      mockProvider(ProjectsService, {
        getList: () => of(mockProjectsList),
        getChildrenOf: () => of(mockProjectsList),
        getParentsOf: () => of(mockProjectsList),
        getRecursiveParent: () => of(mockProjectsList),
        getMembers: () => of([mockProjectMember]),
        getMembersUp: () => of([mockProjectMember]),
        addMember: () => of(mockProjectMember),
        patchMember: () => of(mockProjectMember),
        deleteMember: () => of(),
        search: () => of(mockProjectMember),
        add: () => of(mockProjectMember),
        get: () => of(mockProjectMember),
        patch: () => of(mockProjectMember),
        restore: () => of(mockProjectMember),
        getRelations: () => of([mockProjectRelation]),
        addRelation: () => of(mockProjectRelation),
        putRelation: () => of(mockProjectRelation),
        deleteRelation: () => of(),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should add a new project', () => {
    spectator.service.add(mockProject).subscribe(val => expect(val).toEqual(mockProjectMember));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should get data via getList() with HttpParams', () => {
    const params = new HttpParams().set('test', 'true').set('parent_projects_and_orphans', 'true');
    spectator.service.getList(params).subscribe(data => {
      expect(data).toEqual(mockProjectsList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data via getChildrenOf() with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getChildrenOf(pk, params).subscribe(data => {
      expect(data).toEqual(mockProjectsList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}&parent_project=${pk}`, HttpMethod.GET);
  });

  it('should get data via getChildrenOf() without HttpParams', () => {
    spectator.service.getChildrenOf(pk).subscribe(data => {
      expect(data).toEqual(mockProjectsList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?parent_project=${pk}`, HttpMethod.GET);
  });

  it('should get data via getParentsOf() with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getParentsOf(pk, params).subscribe(data => {
      expect(data).toEqual(mockProjectsList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}&parents_of=${pk}`, HttpMethod.GET);
  });

  it('should get data via getParentsOf() without HttpParams', () => {
    spectator.service.getParentsOf(pk).subscribe(data => {
      expect(data).toEqual(mockProjectsList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?parents_of=${pk}`, HttpMethod.GET);
  });

  it('should get data via getRecursiveParent() with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getRecursiveParent(pk, params).subscribe(data => {
      expect(data).toEqual(mockProjectsList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}&recursive_parent=${pk}`, HttpMethod.GET);
  });

  it('should get data via getRecursiveParent() without HttpParams', () => {
    spectator.service.getRecursiveParent(pk).subscribe(data => {
      expect(data).toEqual(mockProjectsList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?recursive_parent=${pk}`, HttpMethod.GET);
  });

  it('should get data via getMembers()', () => {
    spectator.service.getMembers(pk).subscribe(data => {
      expect(data).toEqual([mockProjectMember]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/acls/`, HttpMethod.GET);
  });

  it('should get data via getMembersUp()', () => {
    spectator.service.getMembersUp(pk).subscribe(data => {
      expect(data).toEqual([mockProjectMember]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/acls/get_assigned_users_up/`, HttpMethod.GET);
  });

  it('should add a project member', () => {
    spectator.service.addMember(pk, {} as any).subscribe(data => {
      expect(data).toEqual(mockProjectMember);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/acls/`, HttpMethod.POST);
  });

  it('should patch a project member', () => {
    spectator.service.patchMember(pk, '1', mockProjectMember).subscribe(data => {
      expect(data).toEqual(mockProjectMember);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/acls/1/`, HttpMethod.PATCH);
  });

  it('should delete a project member', () => {
    spectator.service.deleteMember(pk, '1').subscribe(data => {
      expect(data).toBeUndefined();
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/acls/1/`, HttpMethod.DELETE);
  });

  it('should search project with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.search('Test', params).subscribe(data => {
      expect(data).toEqual(mockProject);
    });
    spectator.expectOne(`${environment.apiUrl}/projects/?${params.toString()}&search=Test`, HttpMethod.GET);
  });

  it('should search project without HttpParams', () => {
    spectator.service.search('Test').subscribe(data => {
      expect(data).toEqual(mockProject);
    });
    spectator.expectOne(`${environment.apiUrl}/projects/?search=Test`, HttpMethod.GET);
  });

  it('should get project details', () => {
    spectator.service.get(pk).subscribe(data => {
      expect(data).toEqual(mockProject);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.GET);
  });

  it('should delete a project', () => {
    spectator.service.delete(pk).subscribe(data => {
      expect(data).toEqual(mockProject);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/soft_delete/`, HttpMethod.PATCH);
  });

  it('should patch a project', () => {
    spectator.service.patch(pk, mockProject).subscribe(val => expect(val).toEqual(mockProject));
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });

  it('should restore a project', () => {
    spectator.service.restore(pk).subscribe(data => {
      expect(data).toEqual(mockProject);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/restore/`, HttpMethod.PATCH);
  });

  it('should get data via getRelations() with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getRelations(pk, params).subscribe(data => {
      expect(data).toEqual([mockProjectRelation]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/relations/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data via getRelations() without HttpParams', () => {
    spectator.service.getRelations(pk).subscribe(data => {
      expect(data).toEqual([mockProjectRelation]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/relations/`, HttpMethod.GET);
  });

  it('should create a relation', () => {
    spectator.service.addRelation(pk, mockProjectRelationPayload).subscribe(data => {
      expect(data).toEqual(mockProjectRelation);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/relations/`, HttpMethod.POST);
  });

  it('should put a relation', () => {
    spectator.service.putRelation(pk, '1', mockProjectRelation).subscribe(data => {
      expect(data).toEqual(mockProjectRelation);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/relations/1/`, HttpMethod.PUT);
  });

  it('should delete a relation', () => {
    spectator.service.deleteRelation(pk, '1').subscribe(data => {
      expect(data).toBeUndefined();
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/relations/1/`, HttpMethod.DELETE);
  });

  it('should duplicate a project', () => {
    spectator.service.duplicate(pk).subscribe(data => {
      expect(data).toEqual(mockProject);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/duplicate/`, HttpMethod.POST);
  });
});
