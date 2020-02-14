<?php

// Enrico Simonetti
// 2017-03-16

class BulkImport
{
    protected $import_settings = [];
    protected $response = [];
    protected $api_user = null;

    /**
     * Initiate BulkImport
     */
    public function __construct()
    {
        $this->loadConfigSettings();
        $this->initiateResponseArray();
    }

    /**
     * Get response array
     * @return array
     */
    public function getResponseArray()
    {
        foreach (['count', 'list'] as $type) {
            foreach ($this->response[$type] as $key => $val) {
                if (empty($val)) {
                    unset($this->response[$type][$key]);
                }
            }
        }
        return $this->response;
    }

    /**
     * Get import settings
     * @return array
     */
    public function getImportSettings()
    {
        return $this->import_settings;
    }

    /**
     * Get maximum record limit per request
     * @return int
     */
    public function getRecordLimit()
    {
        $limit = 100;
        if (!empty($this->import_settings['max_records'])) {
            $limit = $this->import_settings['max_records'];
        }
        return $limit;
    }

    /**
     * Impersonate a user by his/her record id
     * @param string $id
     * @return bool
     */
    public function impersonateUserById($id = '')
    {
        global $current_user;
        $GLOBALS['log']->info('Bulk Import - Impersonating user with id ' . $id . ' from id ' . $current_user->id); 
        if (!empty($id) && empty($this->api_user) && $current_user->isAdmin()) {
            // clone original user
            $this->api_user = clone($current_user);
            $user = BeanFactory::getBean('Users', $id);
            // if the user was found
            if (!empty($user) && !empty($user->id)) {
                $current_user = $user;
                $GLOBALS['log']->info('Bulk Import - Impersonated user with id ' . $current_user->id); 
                return true;
            }
        }
        $GLOBALS['log']->error('Bulk Import - Failed to impersonate user with id ' . $id . ' from id ' . $current_user->id); 
        return false;
    }

    /**
     * Restore the original admin user if present
     * @return bool
     */
    public function restoreApiUser()
    {
        global $current_user;
        if (!empty($this->api_user)) {
            $GLOBALS['log']->info('Bulk Import - Restoring original api user from id ' . $current_user->id); 
            // put back the user
            $current_user = clone($this->api_user);
            $this->api_user = null;
            $GLOBALS['log']->info('Bulk Import - Restored original api user with id ' . $current_user->id); 
            return true;
        }
        return false;
    }

    /**
     * Handle additional mapping before save
     * @param SugarBean $b
     * @param array $data
     * @param array $args
     */
    public function handleAdditionalMappingBeforeSave($b, $data, $args)
    {
        // handle user's password hashing for the 'password' plain text field into the user_hash
        if ($b->table_name === 'users' && !empty($data['password'])) {
            $b->user_hash = $b->getPasswordHash($data['password']);
            unset($b->password);
        }

        // only allow override, if we are not impersonating a user right now
        if (empty($this->api_user)) {
            // handle created by overriding
            if (!empty($data['created_by'])) {
                $b->created_by = $data['created_by'];
                $b->set_created_by = false;
            }

            // handle modified user id overriding
            if (!empty($data['modified_user_id'])) {
                $b->modified_user_id = $data['modified_user_id'];
                $b->update_modified_by = false;
            }

            // handle created by overriding with external_created_user_key based on external key lookup
            if (!empty($data['external_created_user_key'])) {
                $sugar_id = $this->getSugarRecordId(BeanFactory::newBean('Users'), $data['external_created_user_key']);
                unset($b->external_created_user_key);

                if (!empty($sugar_id)) {
                    $b->set_created_by = false;
                    $b->created_by = $sugar_id;
                }
            }

            // handle modified by overriding with external_modified_user_key based on external key lookup
            if (!empty($data['external_modified_user_key'])) {
                $sugar_id = $this->getSugarRecordId(BeanFactory::newBean('Users'), $data['external_modified_user_key']);
                unset($b->external_modified_user_key);

                if (!empty($sugar_id)) {
                    $b->update_modified_by = false;
                    $b->modified_user_id = $sugar_id;
                }
            }
        }

        // handle external_assigned_user_key assigned user based on external key lookup
        if (!empty($data['external_assigned_user_key'])) {
            $sugar_id = $this->getSugarRecordId(BeanFactory::newBean('Users'), $data['external_assigned_user_key']);
            unset($b->external_assigned_user_key);

            if (!empty($sugar_id)) {
                $b->assigned_user_id = $sugar_id;
            }
        }

        // if assigned user is empty, set the current user's id
        if (empty($b->assigned_user_id)) {
            global $current_user;
            $b->assigned_user_id = $current_user->id;
        }

        // handle date entered overriding
        if (isset($data['date_entered']) && !empty($data['date_entered'])) {
            $b->update_date_entered = true;
        }

        // handle date modified overriding
        if (isset($data['date_modified']) && !empty($data['date_modified'])) {
            $b->update_date_modified = false;
        }

        // handle team_list | separated list of ids, first team
        if (!empty($data['team_list'])) {
            $teams = explode('|', trim($data['team_list'], ' |'));
            if (!empty($teams) && is_array($teams)) {
                $b->team_id = $teams['0'];
            }
        }

        // call additional custom logic if any
        $this->callCustomLogic($b, $data, $args, 'custom_before_save');
    }

    /**
     * Create new record or update existing
     * @param array $record
     * @param SugarBean $bean
     * @param array $args
     */
    public function handleRecordSave($record, $bean, $args)
    {
        // check for empty record
        if (!$this->isPassedArrayFullyEmpty($record)) {
 
            $external_key_field = $this->getExternalKeyFieldForModule($bean->module_name);

            if (!empty($external_key_field) && !empty($record[$external_key_field])) {
                // retrieve the record
                $record_id = $this->getSugarRecordId($bean, $record[$external_key_field]);

                if (!empty($record_id)) {
                    if (empty($args['skipUpdate'])) {
                        // retrieve also if deleted, and undelete
                        $b = BeanFactory::getBean($args['module'], $record_id, ['deleted' => false]);

                        // handle undelete/delete
                        if (empty($record['deleted']) && !empty($b->deleted)) {
                            $b->mark_undeleted($b->id);
                        } else if (!empty($record['deleted']) && empty($b->deleted)) {
                            $b->mark_deleted($b->id);
                        }

                        // unset id for existing records
                        if (!empty($record['id'])) {
                            unset($record['id']);
                        }

                        // populate bean from data 
                        $this->populateBeanFromData($b, $record); 
                       
                        // handle additional mapping before save
                        $this->handleAdditionalMappingBeforeSave($b, $record, $args);

                        try {
                            $b->save(false);
                            $this->addToResponseArray('updated',
                                [
                                    [
                                        'external_key' => $record[$external_key_field],
                                        'sugar_id' => $b->id,
                                    ]
                                ]
                            );
                        } catch (Exception $e) {
                            $GLOBALS['log']->error(
                                'Bulk Import - Module ' . $args['module'] . ' update failed for ' .
                                'external record key ' . $external_key_field . ': ' . $record[$external_key_field] . ' and sugar id: ' . $b->id
                            );
                            $this->addToResponseArray('errors',
                                [
                                    [
                                        'external_key' => $record[$external_key_field],
                                        'sugar_id' => $b->id,
                                        'message' => 'Module ' . $args['module'] . ' update failed',
                                    ]
                                ]
                            );
                        }
                    } else {
                        $this->addToResponseArray('warnings',
                            [
                                [
                                    'external_key' => $record[$external_key_field],
                                    'sugar_id' => $record_id,
                                    'message' => 'Module ' . $args['module'] . ' update skipped as requested',
                                ]
                            ]
                        );
                    }
                } else {
                    // for now a clean bean for each new record
                    $b = BeanFactory::newBean($args['module']);

                    // populate bean from data 
                    $this->populateBeanFromData($b, $record); 
 
                    // handle setting of sugar id if required
                    if (!empty($b->id)) {
                        $b->new_with_id = true;
                    }

                    // handle additional mapping before save
                    $this->handleAdditionalMappingBeforeSave($b, $record, $args);

                    try {
                        $b->save(false);
                        $this->addToResponseArray('created',
                            [
                                [
                                    'external_key' => $record[$external_key_field],
                                    'sugar_id' => $b->id,
                                ]
                            ]
                        );
                    } catch (Exception $e) {
                        $GLOBALS['log']->error(
                            'Bulk Import - Module ' . $args['module'] . ' creation of record failed for ' .
                            'external record key ' . $external_key_field . ': ' . $record[$external_key_field]
                        );
                        $this->addToResponseArray('errors',
                            [
                                [
                                    'external_key' => $record[$external_key_field],
                                    'message' => 'Module ' . $args['module'] . ' creation of record failed',
                                ]
                            ]
                        );
                    }
                }

                // handle additional mapping after save
                if (!empty($b)) {
                    $this->handleAdditionalMappingAfterSave($b, $record, $args);
                }
            } else {
                $GLOBALS['log']->error('Bulk Import - Module ' . $args['module'] . ' key: ' .$external_key_field. ' empty');
                $this->addToResponseArray('errors',
                    [
                        [
                            'message' => 'Module ' . $args['module'] . ' key: ' .$external_key_field. ' empty',
                        ]
                    ]
                );
            }
        } else {
            // passed empty record
            $this->addToResponseArray('warnings',
                [
                    [
                        'message' => 'Empty record passed for module ' . $args['module'],
                    ]
                ]
            );
        }
    }

    /**
     * Create new relationships between objects
     * @param array $record
     * @param SugarBean $leftbean
     * @param SugarBean $rightbean
     * @param array $args
     */
    public function handleRelationshipSave($record, $leftbean, $rightbean, $args)
    {
        $current_error = false;
        $external_rel_keys = $this->getExternalRelationshipKeys($args['module'], $args['linkfield']);

        if (!empty($external_rel_keys) && !empty($record[$external_rel_keys['external_key_field_left']]) && !empty($record[$external_rel_keys['external_key_field_right']])) {
            // retrieve the records
            $sugar_id_left = $this->getSugarRecordId($leftbean, $record[$external_rel_keys['external_key_field_left']]);
            $sugar_id_right = $this->getSugarRecordId($rightbean, $record[$external_rel_keys['external_key_field_right']]);

            if (!empty($sugar_id_left)) {
                if (!empty($sugar_id_right)) {
                    $b = BeanFactory::getBean($leftbean->module_name, $sugar_id_left);

                    if (!empty($record['relationship_params'])) {
                        // adding relationship params
                        $rel_params = $record['relationship_params'];
                    } else {
                        $rel_params = [];
                    }

                    $this->handleManyToManyRelationship($b, [
                        'sugar_id_left' => $sugar_id_left,
                        'external_key_left' => $record[$external_rel_keys['external_key_field_left']],
                        'sugar_id_right' => $sugar_id_right,
                        'external_key_right' => $record[$external_rel_keys['external_key_field_right']],
                        'relationship_params' => $rel_params
                    ], $args);
                } else {
                    $current_error = true;
                    $this->addToResponseArray('errors',
                        [
                            [
                                'external_key_left' => $record[$external_rel_keys['external_key_field_left']],
                                'sugar_id_left' => $sugar_id_left,
                                'external_key_right' => $record[$external_rel_keys['external_key_field_right']],
                                'sugar_id_right' => '',
                            ]
                        ]
                    );
                }
            } else {
                $current_error = true;
                $this->addToResponseArray('errors',
                    [
                        [
                            'external_key_left' => $record[$external_rel_keys['external_key_field_left']],
                            'sugar_id_left' => '',
                            'external_key_right' => $record[$external_rel_keys['external_key_field_right']],
                            'sugar_id_right' => $sugar_id_right,
                        ]
                    ]
                );
            }
        } else {
            $current_error = true;
            $this->addToResponseArray('errors',
                [
                    [
                        'external_key_left' => $record[$external_rel_keys['external_key_field_left']],
                        'sugar_id_left' => '',
                        'external_key_right' => $record[$external_rel_keys['external_key_field_right']],
                        'sugar_id_right' => '',
                    ]
                ]
            );
        }

        // add more comprehensive logging to determine which records did not relate
        if ($current_error) {
            $GLOBALS['log']->error(
                'Bulk Import - Relationship import error due to missing record.' .
                ' Left Module: ' . $leftbean->module_name .
                ' Left key: ' . $record[$external_rel_keys['external_key_field_left']] .
                ' Left id: ' . $sugar_id_left .
                ' Right Module: ' . $rightbean->module_name .
                ' Right key: ' . $record[$external_rel_keys['external_key_field_right']] .
                ' Right id: ' . $sugar_id_right
            );
        }
    }

    /**
     * Populate bean from passed data fields
     * @param SugarBean $bean
     * @param array $data
     */
    protected function populateBeanFromData($bean, $data)
    {
        if (!empty($data) && !empty($bean)) {

            $sugar_key_field = $this->getSugarKeyFieldForModule($bean->module_name);
            $external_key_field = $this->getExternalKeyFieldForModule($bean->module_name);

            foreach ($data as $field => $value) {
                if (!empty($sugar_key_field) && $field === $external_key_field) {
                    $bean->$sugar_key_field = $value;
                } else {
                    // store it if it is not a link field
                    if (empty($bean->field_defs[$field]) || $bean->field_defs[$field]['type'] != 'link') {
                        $bean->$field = $value;
                    }
                }
            }
        }
    }

    /**
     * Check if the required arguments exist
     * @param $args
     */
    public function checkImportArgsForModules($args)
    {
        if (empty($args['module']) || empty($args['records'])) {
            $this->parameterError(
                'Following parameters are empty: ' .
                (empty($args['module']) ? 'Module' : '') .
                (empty($args['records']) ? ', Records' : '')
            );
        }

        if (!in_array($args['module'], $this->getAllowedModules())) {
            $this->parameterError('Module ' . $args['module'] . ' not allowed');
        }
    }

    /**
     * Check if current user is Admin
     * @throws SugarApiExceptionNotAuthorized
     */
    public function checkIfCurrentUserIsAdmin()
    {
        global $current_user;

        if (!$current_user->isAdmin()) {
            $GLOBALS['log']->error('BulkImport - API requires an Admin user');
            throw new SugarApiExceptionNotAuthorized('BulkImport API requires an Admin user');
        }
    }

    /**
     * Log functionality with error and exception
     * @param $message
     * @throws SugarApiExceptionInvalidParameter
     */
    public function parameterError($message) {
        $GLOBALS['log']->error('Bulk Import - '.$message);
        throw new SugarApiExceptionInvalidParameter($message);
    }

    /**
     * Log execution time if more than 30 seconds
     * @param $message
     */
    public function logExecutionTime($time) {
        if ($time > 30) {
            $GLOBALS['log']->fatal('Bulk Import - Slow execution time: ' . $time . '. Please reduce the number of records passed to the Bulk Import API at any one time'); 
        } else {
            $GLOBALS['log']->info('Bulk Import - Finished, total execution time: ' . $time); 
        }
    }   

    /**
     * Get allowed relationship modules
     * @return array
     */
    public function getAllowedRelationshipModules() {
        if (!empty($this->import_settings['relationships'])) {
            return array_keys($this->import_settings['relationships']);
        }
        
        return [];
    }

    /**
     * Retrieves allowed relationship link fields for a module
     * @param string $module
     * @return array
     */
    public function getAllowedRelationshipLinkfields($module) {
        if (!empty($module) && !empty($this->import_settings['relationships'][$module])) {
            return array_keys($this->import_settings['relationships'][$module]);
        }
        
        return [];
    }

    /**
     * Retrieves a Sugar record id by executing a SQL lookup, based on the predefined configuration query
     * @param SugarBean $b
     * @param string $lookup_id
     * @return false|string
     */
    protected function getSugarRecordId($b, $lookup_id)
    {
        // check if it is a valid module
        if (!empty($b)) {
            $query = $this->writeSQLQuery($b->module_name);
            $stmt = $GLOBALS['db']->getConnection()->executeQuery($query, [$lookup_id]);
            $id = $stmt->fetch();

            if(!empty($id)) {
                // return the value, whatever the key might be (id or id_c)
                return current($id);
            }
        }

        return false;
    }

    /**
     * Handles custom after save
     * @param SugarBean $b
     * @param array $data
     * @param array $args
     */
    private function handleAdditionalMappingAfterSave($b, $data, $args)
    {
        // handle team_list | separated list of ids
        if (!empty($data['team_list'])) {
            $teams = explode('|', trim($data['team_list'], ' |'));
            if (!empty($teams) && is_array($teams)) {
                $b->load_relationship('teams');
                $b->teams->replace(
                    $teams
                );
            }
        }

        // call additional custom logic if any
        $this->callCustomLogic($b, $data, $args, 'custom_after_save');
    }

    /**
     * Handles many to many relationship
     * @param SugarBean $b
     * @param array $data
     * @param array $args
     */
    private function handleManyToManyRelationship($b, $data, $args)
    {
        $linkfield = '';
        if (in_array($args['linkfield'], $this->getAllowedRelationshipLinkfields($args['module']))) {
            $linkfield = $args['linkfield'];
        }

        if (!empty($linkfield)) {
            // relate the records
            $b->load_relationship($linkfield);
            if (!empty($b->$linkfield)) {

                if (!empty($data['relationship_params']) && is_array($data['relationship_params'])) {
                    try {
                        $b->$linkfield->add($data['sugar_id_right'], $data['relationship_params']);
                        $this->addToResponseArray('related',
                            [
                                [
                                    'external_key_left' => $data['external_key_left'],
                                    'sugar_id_left' => $b->id,
                                    'external_key_right' => $data['external_key_right'],
                                    'sugar_id_right' => $data['sugar_id_right'],
                                ]
                            ]
                        );
                    } catch (Exception $e) {
                        $this->addToResponseArray('errors',
                            [
                                [
                                    'external_key_left' => $data['external_key_left'],
                                    'sugar_id_left' => $b->id,
                                    'external_key_right' => $data['external_key_right'],
                                    'sugar_id_right' => $data['sugar_id_right'],
                                ]
                            ]
                        );
                    }
                } else {
                    try {
                        $b->$linkfield->add($data['sugar_id_right']);
                        $this->addToResponseArray('related',
                            [
                                [
                                    'external_key_left' => $data['external_key_left'],
                                    'sugar_id_left' => $b->id,
                                    'external_key_right' => $data['external_key_right'],
                                    'sugar_id_right' => $data['sugar_id_right'],
                                ]
                            ]
                        );
                    } catch (Exception $e) {
                        $this->addToResponseArray('errors',
                            [
                                [
                                    'external_key_left' => $data['external_key_left'],
                                    'sugar_id_left' => $b->id,
                                    'external_key_right' => $data['external_key_right'],
                                    'sugar_id_right' => $data['sugar_id_right'],
                                ]
                            ]
                        );
                    }
                }
            }
        }
    }

    /**
     * Initiate response array
     */
    private function initiateResponseArray()
    {
        $this->response = [];
        $this->response['count'] = [];
        $this->response['count']['related'] = 0;
        $this->response['count']['created'] = 0;
        $this->response['count']['updated'] = 0;
        $this->response['count']['warnings'] = 0;
        $this->response['count']['errors'] = 0;

        $this->response['list'] = [];
        $this->response['list']['related'] = [];
        $this->response['list']['created'] = [];
        $this->response['list']['updated'] = [];
        $this->response['list']['warnings'] = [];
        $this->response['list']['errors'] = [];
    }

    /**
     * Add the current information to the response array
     * @param string $list_type
     * @param array $list
     */
    private function addToResponseArray($list_type, $list)
    {
        if (!empty($list_type) && !empty($list)) {
            foreach ($list as $val) {
                $this->response['list'][$list_type][] = $val;
            }

            // update count
            $this->response['count'][$list_type] = count($this->response['list'][$list_type]);
        }
    }

    /**
     * Check if all the properties of a record passed are empty
     * @param array $record
     * @return bool
     */
    private function isPassedArrayFullyEmpty($record) {
        if (!empty($record)) {
            foreach ($record as $field => $value) {
                if (!empty($value)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Load configuration
     */
    private function loadConfigSettings() {
        $this->import_settings = SugarConfig::getInstance()->get('bulk_import_settings');
    }

    /**
     * Get allowed import modules
     * @return array
     */
    private function getAllowedModules() {
        return array_keys($this->import_settings['modules']);
    }

    /**
     * Get external relationship keys
     * @param string $module
     * @param string $linkfield
     * @return array
     */
    private function getExternalRelationshipKeys($module, $linkfield) {
        if (!empty($module) && !empty($linkfield) && !empty($this->import_settings['relationships'][$module][$linkfield])) {
            return $this->import_settings['relationships'][$module][$linkfield];
        }

        return [];
    }

    /**
     * Get sugar key field name for module (as in the db field)
     * @param string $module
     * @return string
     */
    private function getSugarKeyFieldForModule($module) {
        if (!empty($module) && !empty($this->import_settings['modules'][$module]['sugar_key_field'])) {
            return $this->import_settings['modules'][$module]['sugar_key_field'];
        }

        return '';
    }

    /**
     * Get external key field name for module (as in the field passed in the request)
     * @param string $module
     * @return string|void
     */
    private function getExternalKeyFieldForModule($module) {
        if (!empty($module) && !empty($this->import_settings['modules'][$module]['external_key_field'])) {
            return $this->import_settings['modules'][$module]['external_key_field'];
        }
        
        return '';
    }

    /**
     * Get SQL query for the lookup, based on configuration settings
     * @param string $module
     * @return string|void
     */
    private function writeSQLQuery($module) {
        if (!empty($module) && !empty($this->import_settings['modules'][$module]['sql_query'])) {
            return $this->import_settings['modules'][$module]['sql_query'];
        }

        return '';
    }

    /**
     * Call custom logic either before or after save, if configured
     * @param SugarBean $b
     * @param array $data
     * @param array $args
     * @param string $type
     */
    private function callCustomLogic($b, $data, $args, $type) {
        if ($type === 'custom_before_save') {
            if (
                !empty($this->import_settings['modules'][$b->module_name]['custom_before_save']['file'])
                && !empty($this->import_settings['modules'][$b->module_name]['custom_before_save']['class'])
            ) {
                require_once($this->import_settings['modules'][$b->module_name]['custom_before_save']['file']);

                $custom_class = new $this->import_settings['modules'][$b->module_name]['custom_before_save']['class'];
                if (method_exists($custom_class, 'callCustomBeforeSave')) {
                    $custom_class->callCustomBeforeSave($b, $data, $args);
                }
            }
        } else if ($type === 'custom_after_save') {
            if (
                !empty($this->import_settings['modules'][$b->module_name]['custom_after_save']['file'])
                && !empty($this->import_settings['modules'][$b->module_name]['custom_after_save']['class'])
            ) {
                require_once($this->import_settings['modules'][$b->module_name]['custom_after_save']['file']);

                $custom_class = new $this->import_settings['modules'][$b->module_name]['custom_after_save']['class'];
                if (method_exists($custom_class, 'callCustomAfterSave')) {
                    $custom_class->callCustomAfterSave($b, $data, $args);
                }
            }
        }
    }
}
