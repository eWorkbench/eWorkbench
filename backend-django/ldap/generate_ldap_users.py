from faker import Faker
fake = Faker()

for i in range(0, 100000):
    name = fake.name()
    first_name = name.split(' ')[0]
    last_name = ' '.join(name.split(' ')[-1:])
    username = first_name[0].lower() + first_name[1].lower() + last_name.lower().replace(' ', '')
    print("# Fake Entry {}".format(i))
    print("dn: uid={},ou=People,dc=workbench,dc=local".format(username));
    print("objectclass: account")
    print("objectclass: simpleSecurityObject")
    print("objectclass: top")
    print("uid: {}".format(username))
    print("userpassword: {MD5}NOpKqvJO/LtLMNJzAvhlfw==")
    print("o: external")
    print("")


