import { describe, it, expect } from 'vitest';
import { filterStructsByUsage } from '../src/v2/utils/struct-utils';

describe('filterStructsByUsage', () => {
  it('keeps structs referenced in INPUTS', () => {
    const wrekenfile = {
      METHODS: {
        createUser: {
          INPUTS: [{ body: { TYPE: 'STRUCT(User)' } }],
        },
      },
      STRUCTS: {
        User: [{ NAME: 'name', TYPE: 'STRING' }],
        Unused: [{ NAME: 'id', TYPE: 'INT' }],
      },
    };

    filterStructsByUsage(wrekenfile);
    expect(wrekenfile.STRUCTS).toHaveProperty('User');
    expect(wrekenfile.STRUCTS).not.toHaveProperty('Unused');
  });

  it('keeps structs referenced in RETURNS', () => {
    const wrekenfile = {
      METHODS: {
        getUser: {
          RETURNS: [{ RETURNTYPE: 'STRUCT(UserResponse)' }],
        },
      },
      STRUCTS: {
        UserResponse: [{ NAME: 'id', TYPE: 'INT' }],
      },
    };

    filterStructsByUsage(wrekenfile);
    expect(wrekenfile.STRUCTS).toHaveProperty('UserResponse');
  });

  it('keeps structs referenced in ERRORS', () => {
    const wrekenfile = {
      METHODS: {
        getUser: {
          ERRORS: [{ TYPE: 'STRUCT(ErrorResponse)' }],
        },
      },
      STRUCTS: {
        ErrorResponse: [{ NAME: 'message', TYPE: 'STRING' }],
      },
    };

    filterStructsByUsage(wrekenfile);
    expect(wrekenfile.STRUCTS).toHaveProperty('ErrorResponse');
  });

  it('keeps transitively referenced structs', () => {
    const wrekenfile = {
      METHODS: {
        getUser: {
          RETURNS: [{ RETURNTYPE: 'STRUCT(UserResponse)' }],
        },
      },
      STRUCTS: {
        UserResponse: [{ NAME: 'address', TYPE: 'STRUCT(Address)' }],
        Address: [{ NAME: 'city', TYPE: 'STRING' }],
        Orphan: [{ NAME: 'x', TYPE: 'INT' }],
      },
    };

    filterStructsByUsage(wrekenfile);
    expect(wrekenfile.STRUCTS).toHaveProperty('UserResponse');
    expect(wrekenfile.STRUCTS).toHaveProperty('Address');
    expect(wrekenfile.STRUCTS).not.toHaveProperty('Orphan');
  });

  it('handles array struct types', () => {
    const wrekenfile = {
      METHODS: {
        listUsers: {
          RETURNS: [{ RETURNTYPE: '[]STRUCT(User)' }],
        },
      },
      STRUCTS: {
        User: [{ NAME: 'name', TYPE: 'STRING' }],
      },
    };

    filterStructsByUsage(wrekenfile);
    expect(wrekenfile.STRUCTS).toHaveProperty('User');
  });

  it('handles HTTP.BODY.TYPE references', () => {
    const wrekenfile = {
      METHODS: {
        createUser: {
          HTTP: { BODY: { TYPE: 'STRUCT(CreateUserRequest)' } },
        },
      },
      STRUCTS: {
        CreateUserRequest: [{ NAME: 'name', TYPE: 'STRING' }],
      },
    };

    filterStructsByUsage(wrekenfile);
    expect(wrekenfile.STRUCTS).toHaveProperty('CreateUserRequest');
  });

  it('handles missing STRUCTS gracefully', () => {
    const wrekenfile = { METHODS: {} };
    expect(() => filterStructsByUsage(wrekenfile)).not.toThrow();
  });

  it('handles null input gracefully', () => {
    expect(() => filterStructsByUsage(null)).not.toThrow();
  });
});
