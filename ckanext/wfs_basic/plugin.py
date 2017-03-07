import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import logging

# log = logging.getlogger(_name_)



class Wfs_BasicPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IResourceView, inherit = True)


    # IConfigurer

    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_public_directory(config_, 'public')
        toolkit.add_resource('fanstatic', 'wfs_basic')

    def info(self):
        return {'name': 'wfs_basic',
            'title': 'WFS Basic Functions',
            'schema': {'url': [toolkit.get_validator('ignore_empty')]},
            'iframed': False,
            'icon': 'link',
            'always_available': True,
            'default_title': 'Basic WFS Functions'
            }

    def can_view(self, data_dict):
        r = data_dict['resource']
        return (r.get('format','').lower() in ['wfs'])

    def view_template(self, context, data_dict):
        return 'wfs_func_view.html'

    def form_template(self, context, data_dict):
        return 'wfs_func_form.html'
