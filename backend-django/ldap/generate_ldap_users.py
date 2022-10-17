from faker import Faker

fake = Faker()

for i in range(0, 100000):
    name = fake.name()
    first_name = name.split(" ")[0]
    last_name = " ".join(name.split(" ")[-1:])
    username = first_name[0].lower() + first_name[1].lower() + last_name.lower().replace(" ", "")
    print(f"# Fake Entry {i}")
    print(f"dn: uid={username},ou=People,dc=workbench,dc=local")
    print("objectclass: account")
    print("objectclass: simpleSecurityObject")
    print("objectclass: top")
    print(f"uid: {username}")
    print("userpassword: {MD5}NOpKqvJO/LtLMNJzAvhlfw==")
    print("o: external")
    print("")
