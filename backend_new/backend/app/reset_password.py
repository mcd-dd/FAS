from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

new_hash = pwd.hash("test123")
print(new_hash)

# from passlib.context import CryptContext

# pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# hash_value = "$2b$12$HhJsjuSru46QyQ6rchFKbO9lb4LMM/Eus0KBgT3ePFHQ1R2b.qTUe"

# print(pwd.verify("mcD1@7890", hash_value))