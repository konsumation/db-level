import ldapts from "ldapts";

export const defaultAuthConfig = {
  auth: {
    ldap: {
      url: "ldap://ldap.mf.de",
      bindDN: "uid={{username}},ou=accounts,dc=mf,dc=de",
      entitlements: {
        base: "ou=groups,dc=mf,dc=de",
        attribute: "cn",
        scope: "sub",
        filter:
          "(&(objectclass=groupOfUniqueNames)(uniqueMember=uid={{username}},ou=accounts,dc=mf,dc=de))"
      }
    },
    jwt: {
      options: {
        algorithm: "RS256",
        expiresIn: "12h"
      }
    },
    users: {}
  }
};

export async function authenticate(config, username, password) {
  const auth = config.auth;

  const entitlements = new Set();

  const ldap = auth.ldap;
  if (ldap !== undefined) {
    const client = new ldapts.Client({
      url: ldap.url
    });

    function inject(str) {
      return str.replace(/\{\{username\}\}/, username);
    }

    try {
      await client.bind(inject(ldap.bindDN), password);

      const { searchEntries } = await client.search(
        inject(ldap.entitlements.base),
        {
          scope: ldap.entitlements.scope,
          filter: inject(ldap.entitlements.filter),
          attributes: [ldap.entitlements.attribute]
        }
      );
      searchEntries.forEach(e =>
        entitlements.add(e[ldap.entitlements.attribute])
      );
    } catch (ex) {
      switch (ex.code) {
        case 49: // invalid credentials
          break;
        default:
          console.log(ex);
      }
      throw ex;
    } finally {
      await client.unbind();
    }
  }

  if (auth.users !== undefined) {
    const user = auth.users[username];
    if (user !== undefined && user.password === password) {
      user.entitlements.forEach(e => entitlements.add(e));
    }
  }

  return { entitlements };
}
