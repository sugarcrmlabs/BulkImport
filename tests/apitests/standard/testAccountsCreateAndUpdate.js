const chakram = require('chakram');
const expect = chakram.expect;
const {Agent, Fixtures} = require('@sugarcrm/thorn');

describe('bulkapi', function() {
    it('should error and not create Accounts without external_key as an admin user', function*() {
        this.timeout(10000);
        
        var random = parseInt(Math.random() * 999999);

        this.names = [
            'Account A - ' + random,
            'Account B - ' + random,
            'Account C - ' + random,
            'Account D - ' + random
        ];

        this.ids = [
            'aaaa-' + random,
            'bbbb-' + random,
            'cccc-' + random,
            'dddd-' + random
        ]

        this.records = [
            {
                name: this.names[0],
            },
            {
                name: this.names[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.be.empty;
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.not.be.empty;
        expect(response.body.count.errors).to.be.equal(2);
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.be.empty;
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.not.be.empty;
    });

    it('should create two Accounts as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.ids[0]
            },
            {
                name: this.names[1],
                external_key: this.ids[1]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(2);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.created[1].external_key).to.be.equal(this.ids[1]);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should update two Accounts and create one Account as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.ids[0]
            },
            {
                name: this.names[1],
                external_key: this.ids[1]
            },
            {
                name: this.names[2],
                external_key: this.ids[2]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(2);
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.ids[2]);
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.ids[1]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should update an Account with two Teams as an admin user', function*() {
        this.timeout(10000);
        
        let team = yield Agent.as(Agent.ADMIN).get('Users/1/link/team_memberships&filter=[{"private":true}]');
        var team_id = team.body.records[0].id;
        this.records = [
            {
                name: this.names[0],
                external_key: this.ids[0],
                team_list: team_id + '|1'
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.be.empty;
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(1);
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.be.empty;
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
        
        let account = yield Agent.as(Agent.ADMIN).get('Accounts/' + response.body.list.updated[0].sugar_id);

        //console.log(account.body);
        expect(account).to.have.status(200);
        expect(account.body).to.not.be.empty;
        expect(account.body.id).to.not.be.empty;
        expect(account.body.id).to.be.equal(this.ids[0]);
        expect(account.body.team_name).to.not.be.empty;
        expect(account.body.team_name[0].id).to.not.be.empty;
        expect(account.body.team_name[0].id).to.be.equal(team_id);
        expect(account.body.team_name[0].primary).to.be.equal(true);
        expect(account.body.team_name[1].id).to.not.be.empty;
        expect(account.body.team_name[1].id).to.be.equal('1');
        expect(account.body.team_name[1].primary).to.be.equal(false);
    });

    it('should only create (and not update) Accounts when the skipUpdate flag is set as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                name: this.names[0],
                external_key: this.ids[0]
            },
            {
                name: this.names[3],
                external_key: this.ids[3]
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records, skipUpdate: true });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.not.be.empty;
        expect(response.body.count.created).to.be.equal(1);
        expect(response.body.count.updated).to.be.empty;
        expect(response.body.count.warnings).to.not.be.empty;
        expect(response.body.count.warnings).to.be.equal(1);
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.not.be.empty;
        expect(response.body.list.created[0].external_key).to.be.equal(this.ids[3]);
        expect(response.body.list.updated).to.be.empty;
        expect(response.body.list.warnings).to.not.be.empty;
        expect(response.body.list.warnings[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.warnings[0].sugar_id).to.not.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });

    it('should update as deleted all Accounts when deleted flag is set for every Account as an admin user', function*() {
        this.timeout(10000);
        
        this.records = [
            {
                external_key: this.ids[0],
                deleted: true
            },
            {
                external_key: this.ids[1],
                deleted: true
            },
            {
                external_key: this.ids[2],
                deleted: true
            },
            {
                external_key: this.ids[3],
                deleted: true
            }
        ];

        let response = yield Agent.as(Agent.ADMIN).post('BulkImport/records/Accounts', { records: this.records });

        expect(response).to.have.status(200);
        expect(response.body.count).to.not.be.empty;
        expect(response.body.count.created).to.be.empty;
        expect(response.body.count.updated).to.not.be.empty;
        expect(response.body.count.updated).to.be.equal(4);
        expect(response.body.count.warnings).to.be.empty;
        expect(response.body.count.errors).to.be.empty;
        expect(response.body.list).to.not.be.empty;
        expect(response.body.list.created).to.be.empty;
        expect(response.body.list.updated).to.not.be.empty;
        expect(response.body.list.updated[0].external_key).to.be.equal(this.ids[0]);
        expect(response.body.list.updated[1].external_key).to.be.equal(this.ids[1]);
        expect(response.body.list.updated[2].external_key).to.be.equal(this.ids[2]);
        expect(response.body.list.updated[3].external_key).to.be.equal(this.ids[3]);
        expect(response.body.list.warnings).to.be.empty;
        expect(response.body.list.errors).to.be.empty;
    });
});
